# coding: UTF-8
import glob, os, shutil, sys, yaml

import sys
reload(sys)
sys.setdefaultencoding('utf8')

basedir = os.getcwd()
swagger_ui_html = basedir + "/swaggerUI.html"
index_html = basedir + "/index.html"

# Added NOINDEX in Staging
if len(sys.argv) > 1 and sys.argv[1] == 'dev':
    with open(swagger_ui_html, "r") as file:
        data_lines=file.read()
    data_lines = data_lines.replace('<head>', '<head><meta name="robots" content="noindex, nofollow" />')
    data_lines = data_lines.replace('<title>', '<title>CONFIRM:')
    with open(swagger_ui_html, mode="w") as f:
        f.write(data_lines)

dir = basedir + "/api/"
links = []
for root, dirs, files in os.walk(dir):
    for fname in files:
        if fname.find("yaml"):
            _root, ext = os.path.splitext(fname)
            if ext == ".yaml":
                target_file = root + "/" + fname
                with open(target_file) as file:
                    yml = yaml.safe_load(file)
                    url = yml['paths'].keys()[0]
                    name = yml['paths'].values()[0]['get']['tags'][0]
                    links.append({ "name": name, "url": url })
                shutil.copyfile(swagger_ui_html,target_file.replace("yaml", "html"))

link_html = ""
for link in links:
    link_html += "<tr><td>%s</td><td><a href='%s'>%s</a></td><td>%s</td></tr>" % (link['category'], link['url'], link['name'], link['name'])
# Index html生成
with open(index_html, "r") as file:
    data_lines=file.read()
data_lines = data_lines.replace("##CONTENTS##", link_html)
print("======")
print(data_lines)
with open(index_html, mode="w") as f:
    f.write(data_lines)
