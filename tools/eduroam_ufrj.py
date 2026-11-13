#!/usr/bin/env python3
"""Lê o perfil do eduroam da UFRJ (o .mobileconfig assinado que o CAT, cat.eduroam.org, entrega para iPhone e Mac)
e gera:
  - src/eduroam_ufrj.json: rede, método, fase 2, nome do servidor e os certificados (nome, validade, SHA-256),
    usados na configuração à mão e na conferência de Gestão › Saúde;
  - eduroam-ufrj.mobileconfig (raiz do site): cópia do perfil oficial, sem mudar nada (a assinatura continua valendo),
    para o botão "Instalar o perfil" no iPhone e no Mac.
Uso: python3 tools/eduroam_ufrj.py <perfil.mobileconfig>   (precisa do openssl)
Baixe o perfil de novo no CAT quando a UFRJ atualizar os certificados e rode outra vez."""
import sys, os, json, plistlib, subprocess, tempfile, datetime, shutil
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EAP = {13: 'TLS', 21: 'TTLS', 25: 'PEAP', 43: 'FAST'}
def openssl(*a, entrada=None):
    return subprocess.run(['openssl', *a], input=entrada, capture_output=True, check=True).stdout
def main(arq):
    bruto = open(arq, 'rb').read()
    try:
        plist = openssl('cms', '-verify', '-noverify', '-inform', 'DER', entrada=bruto)  # tira a assinatura para ler
    except subprocess.CalledProcessError:
        plist = bruto  # perfil sem assinatura
    p = plistlib.loads(plist)
    cas, wifi = {}, None
    for c in p['PayloadContent']:
        if c.get('PayloadType') == 'com.apple.security.root':
            with tempfile.NamedTemporaryFile(suffix='.der') as t:
                t.write(c['PayloadContent']); t.flush()
                txt = openssl('x509', '-inform', 'DER', '-in', t.name, '-noout', '-subject', '-enddate', '-fingerprint', '-sha256', '-nameopt', 'multiline').decode()
            cn = next((l.split('=', 1)[1].strip() for l in txt.splitlines() if l.strip().startswith('commonName')), '')
            fim = next(l.split('=', 1)[1].strip() for l in txt.splitlines() if l.startswith('notAfter'))
            fp = next(l.split('=', 1)[1].strip() for l in txt.splitlines() if 'Fingerprint' in l)
            ate = datetime.datetime.strptime(fim, '%b %d %H:%M:%S %Y %Z').strftime('%Y-%m-%d')
            cas[c['PayloadUUID']] = {'nome': cn, 'ate': ate, 'sha256': fp.replace(':', '').lower()}
        elif c.get('PayloadType') == 'com.apple.wifi.managed':
            wifi = c
    if not wifi:
        sys.exit('o perfil não tem a rede Wi-Fi')
    e = wifi['EAPClientConfiguration']
    tipos = [EAP.get(t, str(t)) for t in e.get('AcceptEAPTypes', [])]
    out = {
        'fonte': p.get('PayloadOrganization', '') + ' (cat.eduroam.org)',
        'lido': datetime.date.today().isoformat(),
        'rede': wifi.get('SSID_STR', 'eduroam'),
        'seguranca': 'WPA2-Enterprise' if wifi.get('EncryptionType') == 'WPA2' else wifi.get('EncryptionType', ''),
        'metodo': tipos[0] if tipos else '',
        'fase2': e.get('TTLSInnerAuthentication', 'MSCHAPv2'),
        'servidor': e.get('TLSTrustedServerNames', []),
        'anonima': e.get('OuterIdentity', ''),
        'cas': [cas[u] for u in e.get('PayloadCertificateAnchorUUID', []) if u in cas],
    }
    json.dump(out, open(os.path.join(RAIZ, 'src', 'eduroam_ufrj.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    shutil.copyfile(arq, os.path.join(RAIZ, 'eduroam-ufrj.mobileconfig'))
    hoje = datetime.date.today().isoformat()
    print(json.dumps(out, ensure_ascii=False, indent=1))
    for c in out['cas']:
        if c['ate'] < hoje:
            print('ATENÇÃO: o certificado', c['nome'], 'venceu em', c['ate'])
if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
