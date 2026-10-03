#!/usr/bin/env python3
"""Run Sound Elevator locally. Python 3.8+, no packages required."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import threading
import webbrowser

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run Sound Elevator locally')
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent / 'dist'
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    except OSError as error:
        parser.exit(1, f'Cannot use port {args.port}: {error}\nTry: python start.py --port 8001\n')
    url = f'http://127.0.0.1:{args.port}/'
    print(f'Sound Elevator is running at {url}\nPress Ctrl+C to stop.', flush=True)
    if not args.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nGoodbye!')
    finally:
        server.server_close()
