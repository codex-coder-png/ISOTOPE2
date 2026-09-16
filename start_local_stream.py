#!/usr/bin/env python3
"""Serve the Isotope folder on localhost for true same-origin local tabs."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent
PORT = 8765
os.chdir(ROOT)
print(f"ISOTOPE LOCAL STREAM: http://127.0.0.1:{PORT}/index.html")
ThreadingHTTPServer(("127.0.0.1", PORT), SimpleHTTPRequestHandler).serve_forever()
