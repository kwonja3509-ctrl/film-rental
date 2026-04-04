// 카카오톡 나에게 보내기 알림
const KAKAO_CLIENT_ID     = 'a46dfac3ab16f3149298eb6938f21f6f';
const KAKAO_CLIENT_SECRET = 'FYI57DjlUlOeW7PPe1QCjg2pgBztO0r3';

// 알림 받을 사람들의 리프레시 토큰 목록
const REFRESH_TOKENS = [
  'IPuQRHOfdTbUN16vw8MjcFLQG4qM0uQ7AAAAAgoNFZsAAAGdVFbX1Kj01SImjvGc', // 1번째
  'P6bFd_orPrbgu-Y5-fcYxNkDmiABcUOsAAAAAgoXFp8AAAGdV65h1SrXsvB0zxAC', // 2번째
  'P-fzg6i99pMkHEeKbLoIK0Sa33RRF4c0AAAAAgoXFmIAAAGdWA9lzcc_xW4TVk05', // 3번째
];

async function sendToOne(refreshToken, message) {
  // 리프레시 토큰으로 새 액세스 토큰 발급
  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     KAKAO_CLIENT_ID,
      client_secret: KAKAO_CLIENT_SECRET,
      refresh_token: refreshToken,
    }).toString(),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return { ok: false, detail: tokenData };
  }

  // 나에게 보내기
  const msgRes = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + tokenData.access_token,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      template_object: JSON.stringify({
        object_type: 'text',
        text: message,
        link: {
          web_url:        'https://film-rental.vercel.app/admin.html',
          mobile_web_url: 'https://film-rental.vercel.app/admin.html',
        },
      }),
    }).toString(),
  });
  const result = await msgRes.json();
  return { ok: true, result };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    const results = await Promise.all(
      REFRESH_TOKENS.map(token => sendToOne(token, message))
    );
    res.status(200).json({ success: true, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
