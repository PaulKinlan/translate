var Translator = function(_inputLocale, _outputLocale) {
  var apimethod = "";
  var inputLocale = _inputLocale;
  var outputLocale = _outputLocale;
  this.onTranslate = function() {};

  this.translate = function(text) {
    var translateURL = [
      'translate.google.com/translate_a/t?client=t&hl=',
      inputLocale,
      '&sl=',
      inputLocale, 
      '&tl=',
      outputLocale,
      '&ie=UTF-8&oe=UTF-8&multires=1&otf=2&ssel=0&tsel=0&sc=1&q=',
      encodeURIComponent(text)].join('');

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://www.corsproxy.com/' + translateURL, true);

    xhr.onload = function(e) {
      var arr = eval(e.target.response); // JSON.parse flakes out on the response.
      var translateText = arr[0][0][0];

      this.onTranslate(translateText);
    }.bind(this);

    xhr.send();
  }.bind(this);

  this.setInputLocale = function(_locale) {
    inputLocale = _locale;
  }.bind(this);

  this.setOutputLocale = function(_locale) {
    outputLocale = _locale;
  }.bind(this);
  
  this.getInputLocale = function() {
    return inputLocale;
  }.bind(this);
  
  this.getOutputLocale = function() {
    return outputLocale;
  }.bind(this);
};

var Transcriber = function() {
  
  var capturing = false;
  var final_transcript = "";
  var recognition = new (window.SpeechRecognition ||  window.webkitSpeechRecognition);
  
  recognition.continuous = true;
  recognition.interimResults = true;

  if(recognition === null) {
    // we have a problem.
    console.log("No speech API");
  }

  //
  //  Called when there is a transcription of a users voice.
  //
  var transcriptionReady = function(event) {
    var interim_transcript = '';

    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final_transcript = event.results[i][0].transcript;
        if(this.onFinalTranscription) this.onFinalTranscription(final_transcript);
      } else {
        interim_transcript += event.results[i][0].transcript;
        if(this.onTranscription) this.onTranscription(interim_transcript);
      }
    }
  };

  this.onStartingCapture = function() {};
  this.onTranscription = function() {};
  this.onFinalTranscription = function() {};
  this.onEndingCapture = function() {};

  this.stop = function() {
    capturing = false;
    
    if(this.onEndingCapture) this.onEndingCapture();
    recognition.stop();
  };
 
  this.toggleVoiceCapture = function() {
    capturing = !capturing;

    if(capturing == true) {
       final_transcription = "";
       recognition.onresult = transcriptionReady.bind(this);
       recognition.onspeechstart = this.onStartingCapture.bind(this);
       recognition.onspeechend = this.onEndingCapture.bind(this);
       recognition.onaudioend = this.onEndingCapture.bind(this);
       recognition.onend = this.onEndingCapture.bind(this);
       recognition.start();
    }
    else {
       if(this.onEndingCapture) this.onEndingCapture();
       recognition.onresult = null;
       recognition.onspeechstart = null;
       recognition.onspeechend = null;
       recognition.onaudioend = null;
       recognition.onend = null;
       recognition.stop();
    }
  };
};

$(document).ready(function() {
  var transcriber = new Transcriber();
  var translator = new Translator(window.navigator.language, "es");

  var targetWidth = $("#transcription").width();
  var targetHeight = $("#transcription").height();

  translator.onTranslate = function(text) {
    $("#translation .output").text(text);
    setTimeout(function() { 
      var actualHeight = $("#translation .output")[0].offsetHeight;
      $("#translation .output").css({"fontSize": 3 / Math.max(actualHeight / targetHeight, 0.6) + "em"})
      $("#translation").addClass("ready");
    }, 0);
  };

  transcriber.onTranscription = function(transcript) {
    $("#transcription .text").text(transcript); 
  };

  transcriber.onFinalTranscription = function(transcript) {
    $("#transcription .output").text(transcript); 
    translator.translate(transcript);
    setTimeout(function() { 
      var actualHeight = $("#transcription .output")[0].offsetHeight;
      $("#transcription .output").css({"fontSize": 3 / Math.max(actualHeight /targetHeight, 0.6) + "em"})
      $("#transcription").addClass("ready");
    }, 0);
  };

  transcriber.onStartingCapture = function() {
    //$("#transcription .output").text("").css({"fontSize": "3em"});
    //$("#translation .output").text("").css({"fontSize": "3em"}); 
  };

  transcriber.onEndingCapture = function() {
    $("#speak").removeClass("listening");
  };
  
  $("#translation").click(function(e) {
    if(speechSynthesis.speaking == true) return;
    var text = $(".output", this).text();
    // need to stop the recognition whilst speaking.
    transcriber.stop(); 
    var u = new SpeechSynthesisUtterance();
    u.text = text;
    u.lang = translator.getOutputLocale();
    speechSynthesis.speak(u);
  });

  $("#transcription").click(function(e) {
    if(speechSynthesis.speaking == true) return;
    var text = $(".output", this).text();
    // need to stop the recognition whilst speaking.
    transcriber.stop();
    var u = new SpeechSynthesisUtterance();
    u.text = text;
    u.lang = translator.getInputLocale();
    speechSynthesis.speak(u);
  });

  $("#input").click(function(e){
    translator.setInputLocale("");
  });
 
  $("#output").click(function(e){
    translator.setOutputLocale("");
  });

  $("#speak").click(function(e) {
    if($(this).hasClass("listening") == false) {
      $("#translation").removeClass("ready");
      $("#transcription").removeClass("ready");
    }

    $(this).toggleClass("listening");
    transcriber.toggleVoiceCapture();
  });
});
