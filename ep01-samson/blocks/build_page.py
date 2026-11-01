import json, pathlib
H = pathlib.Path(__file__).parent
data = json.loads((H/"blocks_v2.json").read_text())
tpl = (H/"builder_template.html").read_text()
js = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
(H/"samson-script-builder.html").write_text(tpl.replace("__DATA__", js))
print("ok", len(tpl), len(js))
