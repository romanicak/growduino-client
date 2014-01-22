#!/usr/bin/env python

import os
import re
import subprocess
import shutil

try:
    os.mkdir('build')
except:
    pass

#shutil.rmtree('build', ignore_errors=True)

for root, dirs, files in os.walk('build'):
    for f in files:
        os.unlink(os.path.join(root, f))
    for d in dirs:
        shutil.rmtree(os.path.join(root, d))

js_files = [
    "app/libs/bootstrap-datetimepicker/bootstrap-datetimepicker.min.js",
    "app/libs/bootstrap-datetimepicker/bootstrap-datetimepicker.cs.js",
    "app/js/utils.js",
    "app/js/app.js"
]

css_files = [
    "app/libs/bootstrap-datetimepicker/bootstrap-datetimepicker.min.css",
    "app/css/base.css",
]



re_link = re.compile('\s*<link rel="stylesheet" href="([^"]*)">')
re_js = re.compile('\s*<script src="([^"]*)"></script>')
link_printed = False

with open('build/index.htm', 'w') as fout, open('app/index.htm', 'r') as fin:
    for line in fin:
        if not line.strip():
            continue
        if line.startswith('</head>'):
            fout.write('    <script src="minified.js"></script>\n')
        if not link_printed and line.strip().startswith('<script'):
            link_printed = True
            fout.write('    <link rel="stylesheet" href="minified.css">\n')

        mo = re_link.match(line)
        if mo and not mo.group(1).startswith('//'):
            continue
        mo = re_js.match(line)
        if mo and not mo.group(1).startswith('//'):
            continue
        fout.write(line)


subprocess.call("uglifyjs %s -o build/minified.js" % " ".join(js_files), shell=True)
subprocess.call('cat %s | sed -e "s/..\\/images/images/g" | cleancss -o build/minified.css' % " ".join(css_files), shell=True)

shutil.copytree('app/partials', 'build/partials')
shutil.copytree('app/images', 'build/images')