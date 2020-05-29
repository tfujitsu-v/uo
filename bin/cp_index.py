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
for root, dirs, files in os.walk(dir):
    for fname in files:
        if fname.find("yaml"):
            _root, ext = os.path.splitext(fname)
            if ext == ".yaml":
                target_file = root + "/" + fname
                with open(target_file) as file:
                    yml = yaml.safe_load(file)
                    print(yml['info'])
                shutil.copyfile(swagger_ui_html,target_file.replace("yaml", "html"))
with open(index_html, mode="w") as f:
    f.write("aaa")

