"""Configure the owned Telegram bot without logging or publishing its token.

python3 scripts/setup_bot.py --check       # verify username only
python3 scripts/setup_bot.py --configure   # apply approved public profile/menu
"""
import argparse
import json
from pathlib import Path
import re
import secrets
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).resolve().parent.parent

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--configure', action='store_true')
    args = parser.parse_args()
    if args.check == args.configure:
        parser.error('choose exactly one: --check or --configure')
    token = ''
    env = ROOT / '.env.local'
    if env.exists():
        for line in env.read_text().splitlines():
            if line.strip().startswith('TELEGRAM_BOT_TOKEN='):
                token = line.split('=', 1)[1].strip().strip('"').strip("'")
    if not re.fullmatch(r'\d+:[A-Za-z0-9_-]{20,}', token):
        print(json.dumps({'status':'missing_or_invalid_local_token'},ensure_ascii=False))
        return 2
    profile = json.loads((ROOT / 'bot-profile.json').read_text())
    def call(method, payload=None, upload=None):
        if upload:
            boundary = 'ChikBoundary' + secrets.token_hex(12)
            pieces = []
            for key, value in (payload or {}).items():
                pieces.append((f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n').encode())
            pieces.extend([
                (f'--{boundary}\r\nContent-Disposition: form-data; name="avatar"; filename="chik-avatar.jpg"\r\nContent-Type: image/jpeg\r\n\r\n').encode(),
                upload.read_bytes(), b'\r\n', f'--{boundary}--\r\n'.encode()
            ])
            body=b''.join(pieces)
            headers={'Content-Type':f'multipart/form-data; boundary={boundary}'}
        else:
            body=json.dumps(payload or {},ensure_ascii=False).encode()
            headers={'Content-Type':'application/json'}
        request=Request('https://api.telegram.org/bot'+token+'/'+method,data=body,headers=headers)
        try:
            with urlopen(request,timeout=30) as response:
                result=json.load(response)
        except HTTPError as error:
            try:
                message=json.loads(error.read()).get('description','Telegram API error')
            except Exception:
                message='Telegram API error'
            raise RuntimeError(f'{method}: HTTP {error.code}: '+str(message).replace(token,'[redacted]')) from None
        except (URLError,TimeoutError):
            raise RuntimeError(f'{method}: connection failed; token not logged') from None
        if not result.get('ok'):
            raise RuntimeError(method+': '+str(result.get('description','API failure')).replace(token,'[redacted]'))
        return result['result']
    me=call('getMe')
    if me.get('username') != profile['username']:
        print(json.dumps({'status':'wrong_bot','expected':profile['username'],'actual':me.get('username')},ensure_ascii=False))
        return 3
    if args.check:
        print(json.dumps({'status':'verified','username':me['username'],'id':me['id']},ensure_ascii=False))
        return 0
    with urlopen(profile['web_app_url'],timeout=25) as response:
        page=response.read().decode()
        if response.status!=200 or 'Чик!' not in page:
            raise RuntimeError('public Mini App is not ready')
    assert len(profile['name'])<=64 and len(profile['short_description'])<=120 and len(profile['description'])<=512
    actions=[]
    for method,key in [('setMyName','name'),('setMyShortDescription','short_description'),('setMyDescription','description')]:
        for language in ['', 'ru']:
            call(method,{key:profile[key],'language_code':language})
        actions.append(method)
    call('setMyProfilePhoto',{'photo':json.dumps({'type':'static','photo':'attach://avatar'})},ROOT/profile['photo'])
    actions.append('setMyProfilePhoto')
    call('setChatMenuButton',{'menu_button':{'type':'web_app','text':profile['menu_text'],'web_app':{'url':profile['web_app_url']}}})
    actions.append('setChatMenuButton')
    actual={
        'name':call('getMyName'),
        'short_description':call('getMyShortDescription'),
        'description':call('getMyDescription'),
        'menu_button':call('getChatMenuButton'),
        'profile_photo_count':call('getUserProfilePhotos',{'user_id':me['id'],'limit':1})['total_count'],
    }
    assert actual['name']['name']==profile['name']
    assert actual['description']['description']==profile['description']
    assert actual['short_description']['short_description']==profile['short_description']
    assert actual['menu_button']['web_app']['url']==profile['web_app_url']
    assert actual['profile_photo_count']>0
    output={'status':'configured_and_verified','username':me['username'],'actions':actions,'actual':actual}
    (ROOT/'.site-state').mkdir(exist_ok=True)
    (ROOT/'.site-state/bot-setup.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(output,ensure_ascii=False))
    return 0

if __name__=='__main__':
    try:
        sys.exit(main())
    except Exception:
        # Never emit tracebacks: HTTP exception URLs may contain the bot token.
        print(json.dumps({'status':'setup_failed','message':'Operation failed. No token or URL containing credentials was logged.'}))
        sys.exit(1)
