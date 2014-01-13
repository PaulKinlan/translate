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
        final_transcript += event.results[i][0].transcript;
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

  this.toggleVoiceCapture = function() {
    capturing = !capturing;

    if(capturing == true) {
       if(this.onStartingCapture) this.onStartingCapture();
       final_transcription = "";
       recognition.onresult = transcriptionReady.bind(this);
       recognition.onspeechend = this.onEndingCapture();
       recognition.onaudioend = this.onEndingCapture();
       recognition.onend = this.onEndingCapture();
       recognition.start();
    }
    else {
       if(this.onEndingCapture) this.onEndingCapture();
       recognition.stop();
    }
  };
};

$(document).ready(function() {
  var transcriber = new Transcriber();
  var translator = new Translator("en", "es");

  translator.onTranslate = function(text) {
    $("#translation").text(text);
  };

  transcriber.onTranscription = function(transcript) {
    $("#transcription").text(transcript); 
  };

  transcriber.onFinalTranscription = function(transcript) {
    $("#transcription").text(transcript); 
    translator.translate(transcript);
  };

  transcriber.onStartingCapture = function() {
    $("#transcription").text(""); 
    $("#translation").text(""); 
  };

  transcriber.onEndingCapture = function() {
    $(this).removeClass("listening");
  };
   
  $("#speak").click(function(e) {
    $(this).toggleClass("listening");

    transcriber.toggleVoiceCapture();
  });
});
