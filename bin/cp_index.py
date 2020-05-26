import glob, os, shutil
import subprocess

basedir = os.getcwd()
swagger_ui_html = basedir + "/swagger-ui/dist/swaggerUI.html"
dir = basedir + "/swagger-ui/dist/api/"
for root, dirs, files in os.walk(dir):
    for fname in files:
        if fname.find("yaml"):
            _root, ext = os.path.splitext(fname)
            if ext == ".yaml":
                target_file = root + "/" + fname
                shutil.copyfile(swagger_ui_html,target_file.replace("yaml", "html"))
