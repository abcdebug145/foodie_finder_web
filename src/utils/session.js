export function getSessionId() {
  let sid = sessionStorage.getItem('ff_session_id');
  if (!sid) {
    sid = 'session_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
    sessionStorage.setItem('ff_session_id', sid);
  }
  return sid;
}
