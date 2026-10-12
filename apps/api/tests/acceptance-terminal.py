"""Exercise the actual hidden-password CLI in a synthetic terminal; never echo its password."""
import os, pty, select, subprocess, sys, time
master, slave = pty.openpty()
child = subprocess.Popen(sys.argv[1:], stdin=slave, stdout=slave, stderr=slave, close_fds=True, env={key: value for key, value in os.environ.items() if key != 'BA01_TEST_PASSWORD'})
os.close(slave)
output = b''
answered = 0
deadline = time.monotonic() + 40
try:
    while time.monotonic() < deadline:
        ready, _, _ = select.select([master], [], [], 0.2)
        if ready:
            try:
                data = os.read(master, 8192)
            except OSError:
                break
            if not data:
                break
            output += data
            for prompt in [b'Initial administrator password: ', b'Confirm password: ']:
                if answered == [b'Initial administrator password: ', b'Confirm password: '].index(prompt) and prompt in output:
                    os.write(master, os.environ['BA01_TEST_PASSWORD'].encode() + b'\r')
                    answered += 1
        if child.poll() is not None and not ready:
            break
    if child.poll() is None:
        child.kill()
        raise RuntimeError('terminal timeout')
    if os.environ['BA01_TEST_PASSWORD'].encode() in output:
        raise RuntimeError('password appeared in terminal output')
    sys.stdout.buffer.write(output)
    sys.exit(child.returncode)
finally:
    os.close(master)
    if child.poll() is None:
        child.kill()
