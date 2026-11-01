"""Builds tests/fixtures/sample.docx (a minimal but real Word file) with only the standard library.
Run: python3 scripts/make-docx-fixture.py
"""
import zipfile, pathlib

W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
CT = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"""
RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""
DOC_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""
STYLES = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles {W}>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>
</w:styles>"""
DOCUMENT = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document {W}><w:body>
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Quarterly Plan</w:t></w:r></w:p>
<w:p>
  <w:r><w:t xml:space="preserve">Ship the </w:t></w:r>
  <w:r><w:rPr><w:b/></w:rPr><w:t>editor</w:t></w:r>
  <w:r><w:t xml:space="preserve"> with </w:t></w:r>
  <w:r><w:rPr><w:i/></w:rPr><w:t>sharing</w:t></w:r>
  <w:r><w:t xml:space="preserve"> and </w:t></w:r>
  <w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t>import</w:t></w:r>
  <w:r><w:t>.</w:t></w:r>
</w:p>
</w:body></w:document>"""

out = pathlib.Path(__file__).resolve().parent.parent / "tests" / "fixtures" / "sample.docx"
out.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", CT)
    z.writestr("_rels/.rels", RELS)
    z.writestr("word/_rels/document.xml.rels", DOC_RELS)
    z.writestr("word/styles.xml", STYLES)
    z.writestr("word/document.xml", DOCUMENT)
print(f"wrote {out}")
