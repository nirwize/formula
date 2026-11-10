"""Read Word OMML equations and ordered paragraphs for catalog transcription."""
from __future__ import annotations
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
M = '{http://schemas.openxmlformats.org/officeDocument/2006/math}'
GREEK = {'α':'\\alpha','β':'\\beta','γ':'\\gamma','δ':'\\delta','Δ':'\\Delta','∆':'\\Delta','ε':'\\varepsilon','η':'\\eta','θ':'\\theta','λ':'\\lambda','μ':'\\mu','ν':'\\nu','ξ':'\\xi','π':'\\pi','ρ':'\\rho','σ':'\\sigma','τ':'\\tau','φ':'\\varphi','Φ':'\\Phi','χ':'\\chi','ψ':'\\psi','ω':'\\omega','Ω':'\\Omega','∞':'\\infty','°':'^\\circ','·':'\\cdot ','∙':'\\cdot ','×':'\\times ','≤':'\\leq ','≥':'\\geq ','≈':'\\approx ','→':'\\to ','…':'\\ldots ','−':'-','∑':'\\sum ','∫':'\\int ','⁻':'^-','²':'^2','³':'^3'}

def local(e): return e.tag.split('}')[-1]
def raw(e): return ''.join(x.text or '' for x in e.iter() if x.tag == M+'t')
def norm(s):
    out = ''.join((GREEK[ch]+' ' if ch in GREEK and GREEK[ch].startswith('\\') and not GREEK[ch].endswith(' ') else GREEK.get(ch,ch)) for ch in s)
    return out.replace('cos\\','\\cos \\').replace('sin\\','\\sin \\')
def child(e,name): return e.find(M+name)
def val(e,pr,name,default=''):
    node=e.find(M+pr+'/'+M+name)
    return node.get(M+'val',default) if node is not None else default
def contents(e): return ''.join(math(c) for c in e if local(c) not in {'rPr','ctrlPr','oMathParaPr'} and not local(c).endswith('Pr'))
def math(e):
    t=local(e)
    if t=='r': return norm(raw(e))
    if t=='f': return r'\frac{' + contents(child(e,'num')) + '}{' + contents(child(e,'den')) + '}'
    if t=='sSub': return '{'+contents(child(e,'e'))+'}_{'+contents(child(e,'sub'))+'}'
    if t=='sSup': return '{'+contents(child(e,'e'))+'}^{'+contents(child(e,'sup'))+'}'
    if t=='sSubSup': return '{'+contents(child(e,'e'))+'}_{'+contents(child(e,'sub'))+'}^{'+contents(child(e,'sup'))+'}'
    if t=='acc':
        ch=val(e,'accPr','chr')
        cmd='\\vec' if ch in {'⃗','→'} else '\\hat' if ch=='̂' else '\\bar'
        return cmd+'{'+contents(child(e,'e'))+'}'
    if t=='rad': return r'\sqrt{' + contents(child(e,'e')) + '}'
    if t=='d':
        beg=val(e,'dPr','begChr','(');end=val(e,'dPr','endChr',')')
        return r'\left'+(beg or '.')+' '+contents(child(e,'e'))+r' \right'+(end or '.')
    if t=='func': return contents(child(e,'fName'))+contents(child(e,'e'))
    if t in {'oMath','oMathPara','e','num','den','sub','sup','fName'}: return contents(e)
    if t in {'t','chr','begChr','endChr'}: return ''
    return contents(e)
def paragraph(p):
    out=[]
    def walk(e):
        if e.tag==M+'oMath': out.append({'math':math(e)});return
        if e.tag==W+'t': out.append({'text':e.text or ''});return
        if local(e)=='drawing':out.append({'image':True});return
        for c in e:walk(c)
    walk(p)
    style=p.find(W+'pPr/'+W+'pStyle')
    return {'style':style.get(W+'val','') if style is not None else '', 'parts':out}
def main():
    path=Path(sys.argv[1]); output=Path(sys.argv[2]);
    with zipfile.ZipFile(path) as z: root=ET.fromstring(z.read('word/document.xml'))
    ps=[paragraph(p) for p in root.findall('.//'+W+'p')]
    for i,p in enumerate(ps):p['index']=i
    output.write_text(json.dumps(ps,ensure_ascii=False,indent=2),encoding='utf-8')
    for p in ps:
        s=''.join('['+x['math']+']' if 'math' in x else x.get('text','[IMAGE]') for x in p['parts']).strip()
        if s:print(f"{p['index']:03d} {p['style']:<16} {s}")
if __name__=='__main__':main()
