async function startEditor() {
  const message = document.getElementById('message');
  try {
    const responses = await Promise.all([fetch('/admin/config.json'), fetch('/admin/auth.json')]);
    if (responses.some(response => !response.ok)) throw new Error('无法读取后台配置。');
    const [config, auth] = await Promise.all(responses.map(response => response.json()));
    if (!auth.base_url) {
      message.textContent = '编辑器和内容栏目已准备好，GitHub 登录认证服务尚未连接。连接完成后，这里就可以登录、写文章和上传照片。';
      return;
    }
    const url = new URL(auth.base_url);
    if (url.protocol !== 'https:') throw new Error('认证服务必须使用 HTTPS。');
    if (!window.CMS) throw new Error('编辑器未加载，请检查网络后刷新。');
    config.backend.base_url = url.origin;
    window.CMS.init({config});
    document.getElementById('setup').hidden = true;
  } catch (error) {
    message.textContent = `后台暂时无法启动：${error.message}`;
  }
}
startEditor();
