// Animação de digitação para a mensagem de boas-vindas
document.addEventListener('DOMContentLoaded', () => {
  const welcome = document.querySelector('.welcome');
  if (!welcome) return;
  const text = welcome.textContent;
  welcome.textContent = '';
  let i = 0;
  function type() {
    if (i < text.length) {
      welcome.textContent += text.charAt(i);
      i++;
      setTimeout(type, 35); // velocidade da digitação (ms)
    }
  }
  type();
});