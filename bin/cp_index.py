import glob, os, shutil, sys
import subprocess

basedir = os.getcwd()
swagger_ui_html = basedir + "/swaggerUI.html"
files = ["index.html", "swaggerUI.html"]

# Added NOINDEX in Staging
if len(sys.argv) > 1 and sys.argv[1] == 'dev':
    for file in files:
        with open(file, "r") as f:
            data_lines=f.read()
        data_lines = data_lines.replace('<head>', '<head><meta name="robots" content="noindex, nofollow" />')
        with open(file, "w") as f:
            f.write(data_lines)

dir = basedir + "/api/"
for root, dirs, files in os.walk(dir):
    for fname in files:
        if fname.find("yaml"):
            _root, ext = os.path.splitext(fname)
            if ext == ".yaml":
                target_file = root + "/" + fname
                shutil.copyfile(swagger_ui_html,target_file.replace("yaml", "html"))

