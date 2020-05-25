import glob, os, shutil

dir = os.getcwd()
swagger_ui_html = dir + "/swagger-ui/dist/swaggerUI.html"
print(swagger_ui_html)
ymls = glob.glob(dir + "/swagger-ui/dist/api/*.yaml")
for yml in ymls:
    shutil.copyfile(swagger_ui_html,yml.replace("yaml", "html"))

