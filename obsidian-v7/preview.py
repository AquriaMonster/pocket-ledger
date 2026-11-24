"""Serve only the static app. Supplying a trusted certificate enables private LAN HTTPS."""
from argparse import ArgumentParser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import ssl
parser=ArgumentParser()
parser.add_argument('--bind',default='127.0.0.1')
parser.add_argument('--port',default=8765,type=int)
parser.add_argument('--cert')
parser.add_argument('--key')
args=parser.parse_args()
if bool(args.cert)!=bool(args.key):parser.error('Supply both certificate and key')
handler=partial(SimpleHTTPRequestHandler,directory=str(Path(__file__).resolve().parent/'app'))
server=ThreadingHTTPServer((args.bind,args.port),handler)
if args.cert:
    context=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(args.cert,args.key)
    server.socket=context.wrap_socket(server.socket,server_side=True)
print(f"Pocket Ledger review: {'https' if args.cert else 'http'}://{args.bind}:{args.port}/",flush=True)
server.serve_forever()
