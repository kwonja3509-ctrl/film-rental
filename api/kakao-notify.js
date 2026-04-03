// 카카오톡 나에게 보내기 알림
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    // 1. 리프레시 토큰으로 새 액세스 토큰 발급
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        client_id:     process.env.KAKAO_CLIENT_ID,
        client_secret: process.env.KAKAO_CLIENT_SECRET,
        refresh_token: process.env.KAKAO_REFRESH_TOKEN,
      }).toString(),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'token refresh failed', detail: tokenData });
    }

    // 2. 나에게 보내기
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
    res.status(200).json({ success: true, result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
