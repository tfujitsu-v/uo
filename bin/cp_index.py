import glob, os, shutil, sys
import subprocess

basedir = os.getcwd()
swagger_ui_html = basedir + "/swaggerUI.html"

# devの場合は、noindexを付与
if len(sys.argv) > 1 and sys.argv[1] == 'dev':
    with open(swagger_ui_html,　"w"　,encoding="utf-8") as file:
        filedata=file.read()
        filedata=filedata.replace('<head>','<head><meta name="robots" content="nofollow" />')
        file.write(filedata)

dir = basedir + "/api/"
for root, dirs, files in os.walk(dir):
    for fname in files:
        if fname.find("yaml"):
            _root, ext = os.path.splitext(fname)
            if ext == ".yaml":
                target_file = root + "/" + fname
                shutil.copyfile(swagger_ui_html,target_file.replace("yaml", "html"))

