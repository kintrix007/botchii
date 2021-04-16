#!/usr/bin/python3
import os, sys, shutil
import time, json
from datetime import datetime
from functools import reduce
from typing import List

root = os.path.dirname(os.path.realpath(__file__))
originale_dir = os.getcwd()
CRASH_LOG_DIR = os.path.join(root, "crash_logs")
PACKAGE = os.path.join(root, "package.json")
TSCONFIG = os.path.join(root, "tsconfig.json")

def main():
    os.chdir(root)
    args = parse_args(sys.argv)

    should_update = either_in_list(args, "update", "u")
    no_recompile = either_in_list(args, "no-compile", "n")

    assert_dotenv_exists()
    remove_crash_logs()
    if should_update: update()
    if should_update: update_dependencies()
    if not no_recompile: compile()

    iter = 0

    print("-- launching bot --")
    while True:
        exit_code = os.system(f"node .")
        
        if exit_code == 0:
            print("-- bot stopped --")
            print("-- waiting to update bot... --")
            print("-- ^C to stop --")
            time.sleep(5)
            update()
            update_dependencies()
            compile()
        else:
            current_time = datetime.now().strftime("%Y-%m-%d - %H:%M:%S")
            crash_log = f"stopped at: {current_time}\nexit code: {exit_code}\n"
            print("\n---\n\n" + crash_log + "\n---\n")
            with open(f"{CRASH_LOG_DIR}/crash{iter}.log", "w") as f:
                f.write(crash_log)
            
            iter += 1
        
        print("-- waiting to restart bot... --")
        print("-- ^C to stop --")
        time.sleep(5)       # wait 5 seconds before restarting
        print("-- restarting bot... --")

def assert_dotenv_exists() -> None:
    dotenv_path = os.path.join(root, ".env")
    if not os.path.exists(dotenv_path):
        with open(dotenv_path, "w") as f:
            f.write("OWNER_ID=\"\"\nTOKEN=\"\"")
        print("-- .ENV FILE MISSING --")
        print("Plese put your bot's token and the owner's user ID into the '.env' file")
        exit(41)

def remove_crash_logs() -> None:
    if not os.path.exists(CRASH_LOG_DIR):
        os.mkdir(CRASH_LOG_DIR)
    
    for filename in os.listdir(CRASH_LOG_DIR):
        file = os.path.join(CRASH_LOG_DIR, filename)
        os.remove(file)

def compile() -> None:
    print("-- compiling... --")
    
    try:
        shutil.rmtree(os.path.join(root, "build"))
    except OSError as e:
        print(f"Error: {e.filename} - {e.strerror}")
    
    tsc_path = os.path.join(root, "node_modules", "typescript", "bin", "tsc")
    tsc_exit_code = os.system(f"{tsc_path} -p {root}")
    if tsc_exit_code != 0:
        print(f"tsc stopped with a non-zero exit code ({tsc_exit_code})")
        exit(1)
    print("-- compile successful --")

def update() -> None:
    print("-- updating... --")

    pull_exit_code = os.system("git pull")

    if pull_exit_code != 0:
        print(f"git pull stopped with a non-zero exit code ({pull_exit_code})")
        print("-- skipping update --")
        return

    print("-- update successful --")

def update_dependencies() -> None:
    print("-- updating dependencies... --")

    npm_exit_code = os.system("npm install")

    if npm_exit_code != 0:
        print(f"npm install stupped with a non-zero exit code ({npm_exit_code})")
        print("-- skipping dependency update --")
        return
    
    print("-- dependency update successful --")

def parse_args(args) -> List[str]:
    _, *args = args
    
    if not any(args): return []
    
    dash_args = filter(lambda x: x.startswith("-"), args)
    dash_args = map(lambda x: [y[1:]] if (y := x[1:]).startswith("-") else list(y), dash_args)
    dash_args = list(reduce(lambda a, b: [*a, *b], dash_args, []))

    return dash_args

def either_in_list(arr, *items) -> bool:
    return any(filter(lambda x: x in items, arr))


if __name__ == "__main__":
    main()
