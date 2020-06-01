# coding: UTF-8
import glob, os, shutil, sys, yaml

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
                    print(yml['paths'].values())
                    links.append(yml['paths'].keys()[0])
                shutil.copyfile(swagger_ui_html,target_file.replace("yaml", "html"))

link_html = ""
for link in links:
    link_html += "<tr><td>%s</td><td>%s</td><td>%s</td></tr>" % (link, link, link)
# Index html生成
with open(index_html, "r") as file:
    data_lines=file.read()
data_lines = data_lines.replace("##CONTENTS##", link_html)
print("======")
print(data_lines)
with open(index_html, mode="w") as f:
    f.write(data_lines)
