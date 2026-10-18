(() => {
 const script=document.createElement('script');
 if(new URLSearchParams(location.search).get('mode')==='classic')script.src='/platformer/game.js?v=27';
 else {script.type='module';script.src='/platformer/runner.js?v=20261018-run1';}
 script.onerror=()=>{const p=document.createElement('p');p.textContent='게임을 불러오지 못했어요. 새로고침해 주세요.';document.querySelector('main').prepend(p);};
 document.body.append(script);
})();
