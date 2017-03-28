#include <unistd.h>
#include "jdata.h"
#include "command.h"
#include "jam.h"
#include <stdio.h>
typedef char* jcallback;
jamstate_t *js;
int hello(char* s){
printf("Printing from hello function..%s returning the length of string..\n", s);
return strlen(s) * strlen(s);
}
void callhello(void *act, void *arg) {
command_t *cmd = (command_t *)arg;
activity_complete(js->atable, cmd->actid, "i", hello(cmd->args[0].val.sval));
}

int user_main() {
printf("In the main...\n");
}

void user_setup() {
activity_regcallback(js->atable, "hello", SYNC, "s", callhello);
}

void jam_run_app(void *arg) {
user_main();
}

void taskmain(int argc, char **argv) {

    js = jam_init(1883);
    user_setup();
     
    taskcreate(jam_event_loop, js, 50000);
    taskcreate(jam_run_app, js, 50000);
  }
