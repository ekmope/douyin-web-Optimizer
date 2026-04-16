// ==UserScript==
// @name         Douyin Clean & Best Quality
// @name:zh-CN   抖音净化 + 自动最高画质
// @namespace    http://tampermonkey.net/
// @version      13.0
// @description  Standalone Douyin userscript that hides selected page clutter and switches the player to the best available quality automatically.
// @description:zh-CN  合并页面净化与自动最高画质，不依赖 AdGuard，可独立使用。
// @match        https://www.douyin.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const STYLE_ID = 'douyin-merged-adg-style';
    const RULES = [
        '#btn-feelgood',
        '#douyin-navigation > div.cYSl9Ppa:last-child > div.MKOzvYDg.Yr4fQlKQ:last-child > div.IHrj7RhK.U9C7HmQ0.kTlD1StT > div:first-child > div.DlKicC22:first-child > div.q06xF672.Jo9KVamQ > div.qmhaloYp:first-child',
        '#douyin-navigation > div.cYSl9Ppa:last-child > div.MKOzvYDg.Yr4fQlKQ:last-child > div.IHrj7RhK.U9C7HmQ0.kTlD1StT > div:first-child > div.DlKicC22:first-child > div.q06xF672.Jo9KVamQ > div.qmhaloYp:nth-child(3)',
        '#douyin-navigation > div.cYSl9Ppa:last-child > div.MKOzvYDg.Yr4fQlKQ:last-child > div.IHrj7RhK.U9C7HmQ0.kTlD1StT > div:first-child > div.DlKicC22:first-child > div.q06xF672.Jo9KVamQ > div.qmhaloYp:nth-child(9)',
        '#douyin-navigation > div.cYSl9Ppa:last-child > div.MKOzvYDg.Yr4fQlKQ:last-child > div.IHrj7RhK.U9C7HmQ0.kTlD1StT > div:first-child > div.DlKicC22:first-child > div.q06xF672.Jo9KVamQ > div.qmhaloYp:nth-child(10)',
        '#douyin-navigation > div.cYSl9Ppa:last-child > div.MKOzvYDg.Yr4fQlKQ:last-child > div.IHrj7RhK.U9C7HmQ0.kTlD1StT > div:first-child > div.DlKicC22:first-child > div.q06xF672.Jo9KVamQ > div.qmhaloYp:nth-child(11)',
        '#douyin-navigation > div.cYSl9Ppa:last-child > div.MKOzvYDg.Yr4fQlKQ:last-child > div.IHrj7RhK.U9C7HmQ0.kTlD1StT > div:first-child > div.DlKicC22:first-child > div.q06xF672.Jo9KVamQ > div.qmhaloYp:nth-child(12)',
        '#douyin-navigation > div.cYSl9Ppa:last-child > div.MKOzvYDg.Yr4fQlKQ:last-child > div.IHrj7RhK.U9C7HmQ0.kTlD1StT > div:first-child > div.DlKicC22:first-child > div.q06xF672.Jo9KVamQ > div.qmhaloYp:nth-child(13)',
        '#douyin-navigation > div.cYSl9Ppa:last-child > div.MKOzvYDg.Yr4fQlKQ:last-child > div.IHrj7RhK.U9C7HmQ0.kTlD1StT > div:first-child > div.DlKicC22:first-child > div.q06xF672.Jo9KVamQ > div._e7lJDCC:nth-child(2)',
        '#douyin-navigation > div.cYSl9Ppa:last-child > div.MKOzvYDg.Yr4fQlKQ:last-child > div.IHrj7RhK.U9C7HmQ0.kTlD1StT > div.wlJhKwNH.kTlD1StT:last-child',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.zR9VVGqx > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.i2VIB6P0:first-child > div.E89RjVdY.IjPhrbh1.immersive-player-switch-on-hide-interaction-area.cG83852M.maYNkqDi.positionBox > div.I6U7FiE8.immersive-player-switch-on-hide-interaction-area > div.zqe4B9aR.WU6dkKao:first-child > div:nth-child(7)',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.i2VIB6P0:first-child > div.E89RjVdY.IjPhrbh1.immersive-player-switch-on-hide-interaction-area.cG83852M.maYNkqDi.positionBox > div.I6U7FiE8.immersive-player-switch-on-hide-interaction-area > div.zqe4B9aR.WU6dkKao:first-child > div:nth-child(7)',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.i2VIB6P0:first-child > div.E89RjVdY.IjPhrbh1.immersive-player-switch-on-hide-interaction-area.cG83852M.maYNkqDi.positionBox > div.I6U7FiE8.immersive-player-switch-on-hide-interaction-area > div.zqe4B9aR.WU6dkKao:first-child > div:first-child > div.B0JKdzQ8.KsoclCZj.sVGJfEdt > div.JbfEzak6:last-child',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.U0RTp0k8.player-position-box-bottom:nth-child(5) > div.j1LXTVNp.KnvivYg_:first-child',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE.Yyf8NWk0:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.U0RTp0k8.player-position-box-bottom:nth-child(5) > div.j1LXTVNp.KnvivYg_:nth-child(2)',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.rs11G_Sy > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.i2VIB6P0:nth-child(2) > div.E89RjVdY.IjPhrbh1.immersive-player-switch-on-hide-interaction-area.cG83852M.maYNkqDi.positionBox > div.I6U7FiE8.immersive-player-switch-on-hide-interaction-area > div.zqe4B9aR.WU6dkKao:first-child > div:nth-child(7)',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.rs11G_Sy > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.i2VIB6P0:nth-child(2) > div.E89RjVdY.IjPhrbh1.immersive-player-switch-on-hide-interaction-area.cG83852M.maYNkqDi.positionBox > div.I6U7FiE8.immersive-player-switch-on-hide-interaction-area > div.zqe4B9aR.WU6dkKao:first-child > div.PRYmKwbE.eu1prwNn:last-child',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.rs11G_Sy > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.xgplayer.xgplayer-pc.xgplayer-playing.xgplayer-pause:first-child > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:last-child > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(7)',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE.Yyf8NWk0:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.xgplayer-playing.replay > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8)',
        '#slideMode > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE.Yyf8NWk0:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:nth-child(2) > div.i2VIB6P0:first-child > div.E89RjVdY.IjPhrbh1.immersive-player-switch-on-hide-interaction-area.maYNkqDi.positionBox > div.I6U7FiE8.immersive-player-switch-on-hide-interaction-area > div.zqe4B9aR.WU6dkKao:first-child > div:first-child > div.B0JKdzQ8.KsoclCZj.sVGJfEdt > div.JbfEzak6:last-child',
        '#slideMode > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE.Yyf8NWk0:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:nth-child(2) > div.i2VIB6P0:first-child > div.E89RjVdY.IjPhrbh1.immersive-player-switch-on-hide-interaction-area.maYNkqDi.positionBox > div.I6U7FiE8.immersive-player-switch-on-hide-interaction-area > div.zqe4B9aR.WU6dkKao:first-child > div:nth-child(7)',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE.Yyf8NWk0:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.i2VIB6P0:first-child > div.E89RjVdY.IjPhrbh1.immersive-player-switch-on-hide-interaction-area.maYNkqDi.positionBox > div.I6U7FiE8.immersive-player-switch-on-hide-interaction-area > div.zqe4B9aR.WU6dkKao:first-child > div:nth-child(7)',
        '#room_info_bar > div.Dqiwem6z:last-child',
        '#\\37 625506930715001619 > div.QsZmHyMY.EkVgmM67.K25kJUWJ.fGYqh18e > div.LZjI7fBz.fGYqh18e:last-child',
        '#\\37 625458997709095714 > div.QsZmHyMY.EkVgmM67.K25kJUWJ.fGYqh18e > div.LZjI7fBz.fGYqh18e:last-child > div.S22t_mtE.Ol0WmH83.reportIcon.fGYqh18e:last-child',
        '#\\37 625483975749993265 > div.QsZmHyMY.EkVgmM67.K25kJUWJ.fGYqh18e > div.LZjI7fBz.fGYqh18e:last-child > div.S22t_mtE.Ol0WmH83.reportIcon.fGYqh18e:last-child',
        '#slider-card > div.nLp9LocF:last-child > div.nUA990AY.LivePlayer_Preview.douyin-player.douyin-player-inactive > a.czRvQ5TZ.x9jqrlW9.LiveLinkA:nth-child(10)',
        '#slider-card > div.nLp9LocF:last-child > div.nUA990AY.LivePlayer_Preview.douyin-player.douyin-player-inactive > a.czRvQ5TZ.LiveLinkA:nth-child(10)',
        '#slider-card > div.nLp9LocF:last-child > div.nUA990AY.LivePlayer_Preview.douyin-player > a.czRvQ5TZ.LiveLinkA:nth-child(10)',
        '#island_b69f5 > div.eJhYZuIF.JbKUG3hY.ICAUzM8R > div.dYcWlUlB:first-child',
        '#island_b69f5 > div.eJhYZuIF.JbKUG3hY.ICAUzM8R > div:nth-child(2)',
        '#island_b69f5 > div.eJhYZuIF.JbKUG3hY.ICAUzM8R > div:nth-child(3)',
        '#island_b69f5 > div.eJhYZuIF.JbKUG3hY.ICAUzM8R > div.cbBVPXaz:nth-child(6)',
        '#panel-menu > div.IeBFhfH8:nth-child(2)',
        '#panel-menu > div.IeBFhfH8:nth-child(3)',
        '#semiTabai_card',
        '#semiTabrelated_card',
        '#video-info-wrap > div.video-info-detail.isVideoInfoOptimise:first-child > div > div.eYZ5aEPM.vN8iNcM5:last-child',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.i2VIB6P0:first-child > div.E89RjVdY.IjPhrbh1.immersive-player-switch-on-hide-interaction-area.cG83852M.maYNkqDi.positionBox > div.I6U7FiE8.immersive-player-switch-on-hide-interaction-area > div.zqe4B9aR.WU6dkKao:first-child > div.PRYmKwbE.eu1prwNn:last-child',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.replay.xgplayer-playing.needChapterStyle.xgplayer-inactive > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8)',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.zR9VVGqx > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.replay.xgplayer-playing.xgplayer-inactive > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8)',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE.Yyf8NWk0:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.i2VIB6P0:first-child > div.E89RjVdY.IjPhrbh1.immersive-player-switch-on-hide-interaction-area.maYNkqDi.positionBox > div.I6U7FiE8.immersive-player-switch-on-hide-interaction-area > div.zqe4B9aR.WU6dkKao:first-child > div.PRYmKwbE.eu1prwNn:last-child',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.xgplayer-playing.needChapterStyle.hasChapterTitle.xgplayer-inactive > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8)',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.hasChapterTitle.xgplayer-playing.needChapterStyle > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8)',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.rs11G_Sy > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.xgplayer-playing > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8) > div.xgplayer-watch-later-item.xgplayer-icon.RJJHSx0W:first-child > div.br4OoPdn > div.nbE1Vthg > svg',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.rs11G_Sy > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.xgplayer-playing > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8) > div.xgplayer-watch-later-item.xgplayer-icon.RJJHSx0W:first-child > div.br4OoPdn > div.nbE1Vthg',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.rs11G_Sy > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.xgplayer-playing > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8) > div.xgplayer-watch-later-item.xgplayer-icon.RJJHSx0W:first-child',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.rs11G_Sy > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.xgplayer-playing > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8)',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.zR9VVGqx > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.xgplayer-playing > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8) > div.xgplayer-watch-later-item.xgplayer-icon.RJJHSx0W:first-child > div.br4OoPdn > div.nbE1Vthg > svg',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.zR9VVGqx > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.xgplayer-playing.replay > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8) > div.xgplayer-watch-later-item.xgplayer-icon.RJJHSx0W:first-child > div.br4OoPdn > div.nbE1Vthg',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.zR9VVGqx > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.xgplayer-playing.replay > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8) > div.xgplayer-watch-later-item.xgplayer-icon.RJJHSx0W:first-child',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.zR9VVGqx > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.replay.xgplayer-playing > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8) > div.xgplayer-watch-later-item.xgplayer-icon.RJJHSx0W:first-child',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.zR9VVGqx > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.replay.xgplayer-playing > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8)',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.zR9VVGqx > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.xgplayer-playing > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8) > div.xgplayer-watch-later-item.xgplayer-icon.RJJHSx0W:first-child > div.br4OoPdn > div.nbE1Vthg',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.zR9VVGqx > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.xgplayer-playing > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8) > div.xgplayer-watch-later-item.xgplayer-icon.RJJHSx0W:first-child',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.zR9VVGqx > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.xgplayer-playing > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8)',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.xgplayer-playing > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8) > div.xgplayer-watch-later-item.xgplayer-icon.RJJHSx0W:first-child > div.br4OoPdn > div.nbE1Vthg > svg',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.xgplayer-playing > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8) > div.xgplayer-watch-later-item.xgplayer-icon.RJJHSx0W:first-child > div.br4OoPdn > div.nbE1Vthg',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.xgplayer-playing > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8) > div.xgplayer-watch-later-item.xgplayer-icon.RJJHSx0W:first-child',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.vK1R_RFC:last-child > div.xgplayer.xgplayer-pc.xgplayer-playing > xg-controls.xgplayer-controls.controls_permanent.xgplayer-controls-initshow:nth-child(5) > xg-inner-controls.xg-inner-controls.xg-pos > xg-right-grid.xg-right-grid:last-child > xg-icon.xgplayer-watch-later:nth-child(8)',
        '#sliderVideo > div.E7R0E__S.playerContainer.hide-animation-if-not-suport-gpu.TkocvtkE:first-child > div.JqsBy4t7.slider-video.zR9VVGqx > div.vqN35AZ4.basePlayerContainer.xg5nzy2Q.chapterPlayerStyle.MediaNotSupportStyle.lowPopup:first-child > div.U0RTp0k8.player-position-box-bottom:nth-child(5) > div.xgplayer-shop-anchor.bJEuu5ey.sKtfJyEv:first-child'
    ];

    let stopped = false;
    let currentBest = 0;
    let lastVideoId = null;
    let checkTimer = null;
    let styleGuardObserver = null;
    const observers = [];

    function log(message) {
        console.log(`[抖音合并脚本] ${message}`);
    }

    function disconnectObservers() {
        while (observers.length > 0) {
            observers.pop().disconnect();
        }
        if (styleGuardObserver) {
            styleGuardObserver.disconnect();
            styleGuardObserver = null;
        }
    }

    function buildCssText() {
        return RULES.map((selector) => `${selector} { display: none !important; }`).join('\n');
    }

    function ensureStyles() {
        let style = document.getElementById(STYLE_ID);
        if (!style) {
            style = document.createElement('style');
            style.id = STYLE_ID;
            style.textContent = buildCssText();
            (document.head || document.documentElement).appendChild(style);
            log(`已注入 ${RULES.length} 条页面隐藏规则`);
        }
        return style;
    }

    function startStyleGuard() {
        ensureStyles();
        if (styleGuardObserver) return;

        styleGuardObserver = new MutationObserver(() => {
            if (!document.getElementById(STYLE_ID)) {
                ensureStyles();
            }
        });

        styleGuardObserver.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    function parseQuality(text) {
        const s = (text || '').toLowerCase();
        if (s.includes('4k')) return 4000;
        if (s.includes('2k')) return 2000;
        const match = s.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }

    async function getQualityOptions() {
        const btn = document.querySelector('.xgplayer-playclarity-setting');
        if (!btn) return [];

        let panel = document.querySelector('.xgplayer-playclarity-setting .virtual');
        if (!panel || panel.children.length === 0) {
            btn.click();
            await new Promise((resolve) => setTimeout(resolve, 150));
            panel = document.querySelector('.xgplayer-playclarity-setting .virtual');
            if (!panel) return [];
        }

        panel.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 80));

        return Array.from(panel.querySelectorAll('.item')).filter((item) => {
            const text = item.textContent || '';
            return !text.includes('智能') && !text.includes('自动') && !text.toLowerCase().includes('auto');
        });
    }

    async function upgrade() {
        if (stopped) return;

        const items = await getQualityOptions();
        if (items.length === 0) return;

        let bestItem = null;
        let bestVal = 0;
        for (const item of items) {
            const val = parseQuality(item.textContent);
            if (val > bestVal) {
                bestVal = val;
                bestItem = item;
            }
        }

        if (!bestItem || bestVal <= currentBest) return;

        bestItem.click();
        currentBest = bestVal;
        log(`切换至 ${bestItem.textContent.trim()} (数值=${bestVal})`);

        if (bestVal >= 4000) {
            stopped = true;
            log('已切换到 4K，停止后续画质检测');
            if (checkTimer) {
                clearTimeout(checkTimer);
                checkTimer = null;
            }
            disconnectObservers();
        }
    }

    function getCurrentVideoId() {
        const video = document.querySelector('video[data-xgplayerid], video[src]');
        if (!video) return null;
        return video.getAttribute('data-xgplayerid') || video.currentSrc || video.src || null;
    }

    function scheduleUpgrade(delay = 200) {
        if (stopped) return;
        if (checkTimer) clearTimeout(checkTimer);
        currentBest = 0;
        checkTimer = setTimeout(() => {
            checkTimer = null;
            if (!stopped) {
                upgrade();
            }
        }, delay);
    }

    function handlePotentialNewVideo() {
        const newId = getCurrentVideoId();
        if (newId && newId !== lastVideoId) {
            lastVideoId = newId;
            scheduleUpgrade();
        }
    }

    function registerObserver(target, options, callback) {
        const observer = new MutationObserver(callback);
        observer.observe(target, options);
        observers.push(observer);
    }

    function patchHistoryEvents() {
        const wrap = (methodName) => {
            const original = history[methodName];
            if (typeof original !== 'function') return;
            history[methodName] = function (...args) {
                const result = original.apply(this, args);
                setTimeout(handlePotentialNewVideo, 300);
                return result;
            };
        };

        wrap('pushState');
        wrap('replaceState');
        window.addEventListener('popstate', () => setTimeout(handlePotentialNewVideo, 300));
    }

    function startObservers() {
        registerObserver(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ['src', 'data-xgplayerid']
        }, (mutations) => {
            for (const mutation of mutations) {
                if (mutation.target instanceof HTMLVideoElement) {
                    handlePotentialNewVideo();
                    return;
                }
            }
        });

        registerObserver(document.body, {
            childList: true,
            subtree: true
        }, () => {
            if (!document.querySelector('video')) return;
            handlePotentialNewVideo();
        });
    }

    function init() {
        startStyleGuard();
        patchHistoryEvents();
        startObservers();
        handlePotentialNewVideo();
        scheduleUpgrade(500);
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
