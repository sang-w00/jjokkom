'use strict';
// Email verification is committed by Supabase; never retain browser session tokens.
{
const authReturn = new URLSearchParams(location.hash.slice(1));
if (authReturn.has('access_token') || authReturn.has('error')) {
  history.replaceState(null, '', location.pathname + location.search);
  const note = document.createElement('p'); note.className = 'notice';
  note.textContent = authReturn.has('error') ? '이메일 확인 링크를 완료하지 못했어요. 원래 앱에서 확인 메일과 주소를 확인해 주세요.' : '확인 메일에서 돌아왔다면 원래 쪼꼼 앱에서 같은 이메일·비밀번호로 계정 등록 버튼을 다시 눌러 주세요.';
  document.querySelector('main').prepend(note);
}
}
const platforms = ['darwin-arm64', 'darwin-x64', 'win32-x64'];
const labels = { 'darwin-arm64': 'Mac · Apple Silicon', 'darwin-x64': 'Mac · Intel', 'win32-x64': 'Windows · x64' };
const status = document.getElementById('release-status');
const checksums = document.getElementById('checksums');
function validate(value) {
  if (!value || value.schemaVersion !== 1 || !/^\d+\.\d+\.\d+$/.test(value.version) || !value.assets) throw new Error('잘못된 업데이트 정보');
  for (const platform of platforms) {
    const asset = value.assets[platform];
    const [system, arch] = platform.split('-');
    const filename = `Jjokkom-${value.version}-${system === 'darwin' ? 'mac' : 'win'}-${arch}.${system === 'darwin' ? 'zip' : 'exe'}`;
    if (!asset || asset.url !== `https://github.com/sang-w00/jjokkom/releases/download/v${value.version}/${filename}` || !/^[a-f0-9]{64}$/.test(asset.sha256) || !Number.isSafeInteger(asset.size) || asset.size <= 0 || asset.size > 600 * 1024 * 1024) throw new Error('잘못된 다운로드 정보');
  }
  return value;
}
async function loadRelease() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch('update.json', { signal: controller.signal, cache: 'no-cache' });
    if (!response.ok || !response.body) throw new Error('업데이트 정보를 읽을 수 없음');
    const reader = response.body.getReader();
    const chunks = []; let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 65536) { await reader.cancel(); throw new Error('업데이트 정보가 너무 큼'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total); let cursor = 0;
    for (const chunk of chunks) { bytes.set(chunk, cursor); cursor += chunk.byteLength; }
    const release = validate(JSON.parse(new TextDecoder().decode(bytes)));
    document.querySelector('.version').textContent = release.version;
    status.textContent = `공식 배포 ${release.version} · 파일 크기와 SHA-256을 확인할 수 있어요.`;
    checksums.replaceChildren();
    for (const platform of platforms) {
      const asset = release.assets[platform];
      const card = document.querySelector(`[data-platform="${platform}"]`);
      card.querySelector('a').href = asset.url;
      card.querySelector('small').textContent = `${platform.startsWith('darwin') ? 'ZIP' : 'EXE · NSIS'} · ${(asset.size / 1024 / 1024).toFixed(1)} MB`;
      const row = document.createElement('div'); row.className = 'checksum-row';
      const label = document.createElement('span'); label.textContent = labels[platform];
      const hash = document.createElement('code'); hash.textContent = asset.sha256;
      row.append(label, hash); checksums.append(row);
    }
  } catch {
    status.textContent = '업데이트 정보를 확인하지 못했어요. 공식 GitHub 릴리스에서 파일 배포 여부를 확인해 주세요.';
    checksums.replaceChildren();
    const note = document.createElement('p'); note.textContent = '현재 공식 파일 해시를 불러올 수 없습니다. 릴리스에 첨부된 update.json과 다운로드 파일을 비교해 주세요.';
    checksums.append(note);
  } finally { clearTimeout(timeout); }
}
loadRelease();
// Never guess a Mac's CPU from its user-agent: Apple Silicon browsers also
// identify as Intel. The download cards explain how to check the actual chip.
const isWindows = /Windows/i.test(navigator.userAgent);
if (isWindows) {
  const card = document.querySelector('[data-platform="win32-x64"]');
  card.classList.add('recommended');
  const label = document.createElement('span'); label.className = 'recommend-label'; label.textContent = 'Windows PC에 맞는 다운로드'; card.prepend(label);
}
