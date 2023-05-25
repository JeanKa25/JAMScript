#include <stdio.h>
#include <stdbool.h>
#include <unistd.h>
#include <assert.h>

#include "base64.h"
#include "cnode.h"
#include "dpanel.h"

/*
 * Some forward declarations
 */
void *dpanel_ufprocessor(void *arg);
void dpanel_ucallback(redisAsyncContext *c, void *r, void *privdata);
void *dpanel_dfprocessor(void *arg);
void dpanel_dcallback(redisAsyncContext *c, void *r, void *privdata);
void dflow_callback(redisAsyncContext *c, void *r, void *privdata);

struct queue_entry *get_uflow_object(dpanel_t *dp, bool *last);
void freeUObject(uflow_obj_t *uobj);


/*
 * MAIN DATA PANEL FUNCTIONS
 * For creating, starting, shutting down, etc.
 */

/*
 * The data panel connects to a main Redis server. That is, the data panel
 * is not started without a Redis server (this is the device-level Redis server). 
 * Once the data panel is running, we can add Redis servers at the fog level and also 
 * delete fog servers. 
 */
dpanel_t *dpanel_create(char *server, int port, char *uuid)
{
    // all values in dpanel_t structure are initialized to 0 by default
    dpanel_t *dp = (dpanel_t *)calloc(sizeof(dpanel_t), 1);
    assert(dp != NULL);

    assert(server != NULL);
    assert(port != 0);
    strcpy(dp->server, server);
    dp->port = port;
    dp->uuid = uuid;

    assert(pthread_mutex_init(&(dp->ufmutex), NULL) == 0);
    assert(pthread_mutex_init(&(dp->dfmutex), NULL) == 0);
    assert(pthread_cond_init(&(dp->ufcond), NULL) == 0);
    assert(pthread_cond_init(&(dp->dfcond), NULL) == 0);

    dp->ufqueue = queue_create();
    queue_init(&(dp->ufqueue));

    return dp;
}

void dpanel_setcnode(dpanel_t *dp, void *cn)
{
    dp->cnode = cn;
}

void dpanel_settboard(dpanel_t *dp, tboard_t *tb) 
{
    dp->tboard = (void *)tb;
}

void dpanel_connect_cb(const redisAsyncContext *c, int status) {
    if (status != REDIS_OK) {
        printf("Error: %s\n", c->errstr);
        return;
    }
    printf("Connected...1 \n");
}   

void dpanel_disconnect_cb(const redisAsyncContext *c, int status) {
    if (status != REDIS_OK) {
        printf("Error: %s\n", c->errstr);
        return;
    }
    printf("Disconnected...\n");
}

void dpanel_start(dpanel_t *dp)
{
    int rval;

    rval = pthread_create(&(dp->ufprocessor), NULL, dpanel_ufprocessor, (void *)dp);
    if (rval != 0) {
        perror("ERROR! Unable to start the dpanel ufprocessor thread");
        exit(1);
    }

    printf("Starting... dfprocessor\n");
    rval = pthread_create(&(dp->dfprocessor), NULL, dpanel_dfprocessor, (void *)dp);
    if (rval != 0) {
        perror("ERROR! Unable to start the dpanel dfprocessor thread");
        exit(1);
    }
}

void dpanel_shutdown(dpanel_t *dp)
{
    pthread_join(dp->ufprocessor, NULL);
    pthread_join(dp->dfprocessor, NULL);
}

/*
 * UFLOW PROCESSOR FUNCTIONS
 *
 */
void *dpanel_ufprocessor(void *arg) 
{
    dpanel_t *dp = (dpanel_t *)arg;

    // Initialize the event loop
    dp->uloop = event_base_new();

    dp->uctx = redisAsyncConnect(dp->server, dp->port);
    if (dp->uctx->err)
    {
        printf("ERROR! Connecting to the Redis server at %s:%d\n", dp->server, dp->port);
        exit(1);
    }

    redisLibeventAttach(dp->uctx, dp->uloop);
    redisAsyncSetConnectCallback(dp->uctx, dpanel_connect_cb);
    redisAsyncSetDisconnectCallback(dp->uctx, dpanel_disconnect_cb);

    redisAsyncCommand(dp->uctx, dpanel_ucallback, dp, "fcall get_id 0 %s", dp->uuid);

    event_base_dispatch(dp->uloop);
    // the above call is blocking... so we come here after the loop has exited

    return NULL;
}

void dpanel_connect_dcb(const redisAsyncContext *c, int status) {
    if (status != REDIS_OK) {
        printf("Error: %s\n", c->errstr);
        return;
    }
    printf("Connected... 2\n");
    printf("Doing... subscribe ...\n");
  
}

void dpanel_disconnect_dcb(const redisAsyncContext *c, int status) {
    if (status != REDIS_OK) {
        printf("Error: %s\n", c->errstr);
        return;
    }
    printf("Disconnected...\n");
}


void dpanel_ucallback(redisAsyncContext *c, void *r, void *privdata) 
{
    redisReply *reply = r;
    dpanel_t *dp = (dpanel_t *)privdata;
    struct queue_entry *next = NULL; 
    bool last = true;
    cnode_t *cn = (cnode_t *)dp->cnode;
    if (reply == NULL) {
        if (c->errstr) {
            printf("errstr: %s\n", c->errstr);
        }
        return;
    }
    while (dp->state != REGISTERED && reply->integer <= 0 && dp->ecount <= DP_MAX_ERROR_COUNT) {
        // retry again... for a registration..
        dp->ecount++;
        redisAsyncCommand(dp->uctx, dpanel_ucallback, dp, "fcall get_id 0 %s", dp->uuid);
    }

    if (dp->state != REGISTERED && reply->integer <= 0 && dp->ecount > DP_MAX_ERROR_COUNT) {
        fprintf(stderr, "Unable to register with the data store at %s, %d\n", dp->server, dp->port);
        exit(1);
    }

    // do registration..
    if (dp->state != REGISTERED) {
        if (reply->integer > 0) {
            dp->state = REGISTERED;
            dp->logical_id = reply->integer;
        }
    }

    // TODO: enable pipelining... for larger write throughout...
    //
    if (dp->state == REGISTERED) {
        // pull data from the queue
        next = get_uflow_object(dp, &last);
        if (next != NULL) {
            uflow_obj_t *uobj = (uflow_obj_t *)next->data;

            if (last) {
                // send with a callback
                redisAsyncCommand(dp->uctx, dpanel_ucallback, dp, "fcall uf_write 1 %s %lu %d %d %f %f %s", uobj->key, uobj->clock, dp->logical_id, cn->width, cn->xcoord, cn->ycoord, uobj->value);
            } else {
                // send without a callback for pipelining.
                redisAsyncCommand(dp->uctx, dpanel_ucallback, dp, "fcall uf_write 1 %s %lu %d %d %f %f %s", uobj->key, uobj->clock, dp->logical_id, cn->width, cn->xcoord, cn->ycoord, uobj->value);
            }
            freeUObject(uobj);
            free(next);
        }
    }
}


/*
 * FUNCTIONS for dealing with UFLOW objects
 */

uftable_entry_t *dp_create_uflow(dpanel_t *dp, char *key, char *fmt)
{
    uftable_entry_t *uft = (uftable_entry_t *)calloc(sizeof(uftable_entry_t), 1);
    assert(uft != NULL);
    uft->key = strdup(key);
    uft->fmt = strdup(fmt);
    uft->dpanel = (void *)dp;
    uft->lclock = 0;
    HASH_ADD_STR(dp->uftable, key, uft);
    return uft;
}


struct queue_entry *get_uflow_object(dpanel_t *dp, bool *last) 
{
    struct queue_entry *next = NULL;
    struct queue_entry *nnext;

    while (next == NULL) {
        pthread_mutex_lock(&(dp->ufmutex));
        next = queue_peek_front(&(dp->ufqueue));
        if (next) {
            queue_pop_head(&(dp->ufqueue));
            nnext = queue_peek_front(&(dp->ufqueue));
            if (nnext)
                *last = false;
            else 
                *last = true;
        } else 
            *last = false;
        pthread_mutex_unlock(&(dp->ufmutex));

        if (next == NULL) {
            pthread_mutex_lock(&(dp->ufmutex));
            pthread_cond_wait(&(dp->ufcond), &(dp->ufmutex));
            pthread_mutex_unlock(&(dp->ufmutex));
        }
    }
    return next;
}

void freeUObject(uflow_obj_t *uobj)
{
    free(uobj->value);
    free(uobj);
}


uflow_obj_t *uflow_obj_new(uftable_entry_t *uf, char *vstr) 
{
    uflow_obj_t *uo = (uflow_obj_t *)calloc(sizeof(uflow_obj_t), 1);
    uo->key = uf->key;
    uo->fmt = uf->fmt;
    dpanel_t *dp = uf->dpanel;
    cnode_t *cn = dp->cnode;
    uo->clock = get_jamclock(cn);
    uo->value = strdup(vstr);

    return uo;
}


void ufwrite_int(uftable_entry_t *uf, int x)
{
    dpanel_t *dp = (dpanel_t *)(uf->dpanel);
    struct queue_entry *e = NULL;
    uflow_obj_t *uobj;

    uint8_t buf[16];
    char out[32];

    CborEncoder encoder;
    cbor_encoder_init(&encoder, (uint8_t *)&buf, sizeof(buf), 0);
    cbor_encode_int(&encoder, x);
    int len = cbor_encoder_get_buffer_size(&encoder, (uint8_t *)&buf);
    Base64encode(out, (char *)buf, len);
    uobj = uflow_obj_new(uf, out);

    e = queue_new_node(uobj);
    pthread_mutex_lock(&(dp->ufmutex));
    queue_insert_tail(&(dp->ufqueue), e);
    pthread_cond_signal(&(dp->ufcond));
    pthread_mutex_unlock(&(dp->ufmutex));
}

void ufwrite_double(uftable_entry_t *uf, double x)
{
    dpanel_t *dp = (dpanel_t *)(uf->dpanel);
    struct queue_entry *e = NULL;
    uflow_obj_t *uobj;

    uint8_t buf[16];
    char out[32];

    CborEncoder encoder;
    cbor_encoder_init(&encoder, (uint8_t *)&buf, sizeof(buf), 0);
    cbor_encode_double(&encoder, x);
    int len = cbor_encoder_get_buffer_size(&encoder, (uint8_t *)&buf);
    Base64encode(out, (char *)buf, len);
    uobj = uflow_obj_new(uf, out);

    e = queue_new_node(uobj);
    pthread_mutex_lock(&(dp->ufmutex));
    queue_insert_tail(&(dp->ufqueue), e);
    pthread_cond_signal(&(dp->ufcond));
    pthread_mutex_unlock(&(dp->ufmutex));
}


void ufwrite_str(uftable_entry_t *uf, char *str)
{
    dpanel_t *dp = (dpanel_t *)(uf->dpanel);
    struct queue_entry *e = NULL;
    uflow_obj_t *uobj;

    uint8_t *buf = (uint8_t *)calloc(16 + strlen(str), sizeof(uint8_t));
    char *out = (char *)calloc(16 + (3/2) * strlen(str), sizeof(char));

    CborEncoder encoder;
    cbor_encoder_init(&encoder, (uint8_t *)&buf, sizeof(buf), 0);
    cbor_encode_byte_string(&encoder, (uint8_t *)str, strlen(str));
    int len = cbor_encoder_get_buffer_size(&encoder, (uint8_t *)&buf);
    Base64encode(out, (char *)buf, len);
    uobj = uflow_obj_new(uf, out);

    e = queue_new_node(uobj);
    pthread_mutex_lock(&(dp->ufmutex));
    queue_insert_tail(&(dp->ufqueue), e);
    pthread_cond_signal(&(dp->ufcond));
    pthread_mutex_unlock(&(dp->ufmutex));
    free(buf);
    free(out);
}

void ufwrite_struct(uftable_entry_t *uf, char *fmt, ...)
{
    dpanel_t *dp = (dpanel_t *)(uf->dpanel);
    struct queue_entry *e = NULL;
    uflow_obj_t *uobj;
    va_list args;
    darg_t *uargs;
    char *label;
    nvoid_t *nv;
    
    int len = strlen(fmt);
    assert(len > 0);
    
    uargs = (darg_t *)calloc(len, sizeof(darg_t));

    va_start(args, fmt);
    for (int i = 0; i < len; i++) {
        label = va_arg(args, char *);
        uargs[i].label = strdup(label);
        switch(fmt[i]) {
            case 'n':
                nv = va_arg(args, nvoid_t*);
                uargs[i].val.nval = nv;
                uargs[i].type = D_NVOID_TYPE;
                break;
            case 's':
                uargs[i].val.sval = strdup(va_arg(args, char *));
                uargs[i].type = D_STRING_TYPE;
                break;
            case 'i':
                uargs[i].val.ival = va_arg(args, int);
                uargs[i].type = D_INT_TYPE;
                break;
            case 'd':
            case 'f':                
                uargs[i].val.dval = va_arg(args, double);
                uargs[i].type = D_DOUBLE_TYPE;
                break;
            default:
                break;
        }
    }
    va_end(args);

    int buflen = estimate_cbor_buffer_len(uargs, len);
    uint8_t *buf = (u_int8_t *)calloc(buflen, sizeof(u_int8_t));
    char *out = (char *)calloc(buflen * (3/2), sizeof(char *));

    CborEncoder encoder;
    cbor_encoder_init(&encoder, (uint8_t *)&buf, sizeof(buf), 0);

    do_cbor_encoding(&encoder, uargs, len);
    int clen = cbor_encoder_get_buffer_size(&encoder, (uint8_t *)&buf);
    Base64encode(out, (char *)buf, clen);
    uobj = uflow_obj_new(uf, out);
    free_buffer(uargs, len);
    e = queue_new_node(uobj);
    pthread_mutex_lock(&(dp->ufmutex));
    queue_insert_tail(&(dp->ufqueue), e);
    pthread_cond_signal(&(dp->ufcond));
    pthread_mutex_unlock(&(dp->ufmutex));
    free(buf);
    free(out);
}


/*
 * DFLOW PROCESSOR FUNCTIONS
 */
void *dpanel_dfprocessor(void *arg) 
{
    dpanel_t *dp = (dpanel_t *)arg;
    // Initialize the event loop
    dp->dloop = event_base_new();

    dp->dctx = redisAsyncConnect(dp->server, dp->port);
    if (dp->dctx->err) {
        printf("ERROR! Connecting to the Redis server at %s:%d\n", dp->server, dp->port);
        exit(1);
    }
    dp->dctx2 = redisAsyncConnect(dp->server, dp->port);
    if (dp->dctx2->err) {
        printf("ERROR! Connecting to the Redis server at %s:%d\n", dp->server, dp->port);
        exit(1);
    }
    redisLibeventAttach(dp->dctx, dp->dloop);
    redisAsyncSetConnectCallback(dp->dctx, dpanel_connect_dcb);
    redisAsyncSetDisconnectCallback(dp->dctx, dpanel_disconnect_dcb);
    redisLibeventAttach(dp->dctx2, dp->dloop);
    redisAsyncSetConnectCallback(dp->dctx2, dpanel_connect_dcb);
    redisAsyncSetDisconnectCallback(dp->dctx2, dpanel_disconnect_dcb);
    redisAsyncCommand(dp->dctx2, dpanel_dcallback, dp, "SUBSCRIBE __d__keycompleted");
    event_base_dispatch(dp->dloop);
    // the above call is blocking... so we come here after the loop has exited

    return NULL;
}

// this callback is triggered when a broadcast message is sent by the data store
//
void dpanel_dcallback(redisAsyncContext *c, void *r, void *privdata) 
{
    
    redisReply *reply = r;
    dpanel_t *dp = (dpanel_t *)privdata;
    dftable_entry_t *entry;
    
    if (reply == NULL) {
        if (c->errstr) {
            printf("errstr: %s\n", c->errstr);
        }
        return;
    }

    printf("\n ------->> --------------- dcallback received. %zu...%s\n", reply->elements, reply->element[1]->str);
    printf("\n --hi ----- ..%s\n", reply->element[0]->str);
    if (reply->type == REDIS_REPLY_ARRAY && 
        (strcmp(reply->element[1]->str, "__d__keycompleted") == 0) &&
        (strcmp(reply->element[0]->str, "message") == 0)) {
        // get the dftable entry ... based on key (reply->element[2]->str) 
        HASH_FIND_STR(dp->dftable, reply->element[2]->str, entry);

        if (entry) {
            pthread_mutex_lock(&(entry->mutex));
            if (entry->state == NEW_STATE)
                entry->state = PRDY_RECEIVED;
            else if (entry->state == CRDY_RECEIVED) 
                entry->state = BOTH_RECEIVED;
            pthread_mutex_unlock(&(entry->mutex));
            printf("Trying to read.... %d %s\n", entry->state, entry->key);
           // if (entry->state == BOTH_RECEIVED && entry->taskid > 0) {
                printf("Launching....... %llu\n", entry->taskid);
                redisAsyncCommand(dp->dctx, dflow_callback, entry, "fcall df_lread 1 %s", entry->key);
           // }
        }
    }
}

// this is callback used by the actual reading function for the data in dflow
// so.. here we need to 
//
void dflow_callback(redisAsyncContext *c, void *r, void *privdata) 
{
    redisReply *reply = r;
    // the privdata is pointing to the dftable_entry 
    dftable_entry_t *entry = (dftable_entry_t *)privdata;
    dpanel_t *dp = entry->dpanel;
    tboard_t *t = dp->tboard;
    remote_task_t *rtask = NULL;
    
    if (reply == NULL) {
        if (c->errstr) {
            printf("errstr: %s\n", c->errstr);
        }
        return;
    }

    printf("\n ------------------------------------------- Redis reply type %d\n", reply->type);

    HASH_FIND_INT(t->task_table, &(entry->taskid), rtask);
    if (rtask != NULL)
    {
        rtask->data = strdup("test data"); // TODO: fix this... we need to base64 decode -> CBOR decode -> pass to return value
        rtask->data_size = 1;
        if (rtask->calling_task != NULL)
        {
            rtask->status = DFLOW_TASK_COMPLETED;
            assert(mco_push(rtask->calling_task->ctx, rtask, sizeof(remote_task_t)) == MCO_SUCCESS);
            // place parent task back to appropriate queue - should be batch
            task_place(t, rtask->calling_task);
        }
    }
}


/*
 * FUNCTIONS for dealing with DFLOW objects
 */

// this is function executed by the application task (coroutine)
// it is creating an entry for the variable.
// only done once...
//
dftable_entry_t *dp_create_dflow(dpanel_t *dp, char *key, char *fmt)
{
    // create the dftable_entry, mutex needs to be initialized
    dftable_entry_t *df = (dftable_entry_t *)calloc(sizeof(dftable_entry_t), 1);
    df->key = strdup(key);
    // NOTE: the fmt is used in the decoding process when the data is pulled in
    df->fmt = strdup(fmt);
    df->state = NEW_STATE;
    df->taskid = 0;
    pthread_mutex_init(&df->mutex, NULL);
    // set dpanel.. in the entry..
    df->dpanel = dp;

    // insert into the table - hash table - indexed by the key
    HASH_ADD_STR(dp->dftable, key, df);
    return df;
}


/*
 * Value readers - these are going to block the coroutine by creating a user-level
 * context switch until the data is ready. The coroutine might still face a queuing
 * delay before getting activated. We have readers for primitive values (integer,
 * double, string, etc) and composite values (structures). The sending side (J is
 * pushing a JSON object with field names in the case of structures. For primitive
 * values the J side is pushing the values alone. 
 */

void dfread_int(dftable_entry_t *df, int *val)
{

}

void dfread_double(dftable_entry_t *df, double *val)
{

}

void dfread_string(dftable_entry_t *df, char *val)
{

}

void dfread_struct(dftable_entry_t *df, char *fmt, ...)
{

}
