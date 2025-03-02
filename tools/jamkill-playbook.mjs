- name: Run JAMKill command
  hosts: "{{ server }}"
  gather_facts: no
  tasks:
    - name: Ensure the working directory is correct
      shell: pwd
      args:
        chdir: /home/jamtools/JAMScript/tools

    - name: Run kill command and store logs
      shell: zx wrapper.mjs jamkill > jamkill.log 2>&1
      args:
        chdir: /home/jamtools/JAMScript/tools
