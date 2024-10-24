// This globally holds the lastUrl of the 'window'
let Cmail_lastUrl = "";

// This globally holds the interval running the main loop
let Cmail_interval = null;

// This globally holds the current AI response
let Cmail_response = "";

// This globally holds whether the response is valid
let Cmail_responseValid = false;

// This is the length of the required gmail href
const Cmail_magicNumber = 45;

// This function allows for one script to send a 'global'
// message to listening scripts.
function Cmail_sendMessageToScripts(message) {
  return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError));
          } else {
              resolve(response);
          }
      });
  });
}

// Little quick function to handle Cmail_sendMessageToScripts
function Cmail_sendDataToScripts(str){
  Cmail_sendMessageToScripts({ Cmail_message: str})
    .then(response => {
        if(response == "CMAIL_ERROR")
        {
          Cmail_sendDataToScripts(str);
        }
    })
    .catch(error => {
        //console.error('Error sending message:', error);
    });
}

// This is a basic function to send a prompt to the GeminiAI, using your API key.
function Cmail_HttpSend(prompt) {

  // This creates a new Object
  var xhttp = new XMLHttpRequest();

  // Basically on every 'update' from the request this will be called.
  xhttp.onreadystatechange = () => {
    // Basically returned on success
    if (xhttp.readyState === XMLHttpRequest.DONE && xhttp.status === 200) {
      // Turn text to json
      const data = JSON.parse(xhttp.responseText);

      const strResponse = data.candidates[0].content.parts[0].text;
      /* DO SOMETHING WITH YOUR DATA */
      /* UP TO YOU */
      
      Cmail_response = strResponse;
      Cmail_responseValid = true;
    }
  };

  // Contains the Gemini API link and Api Key.
  const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyAj-wkm7S2PXtwrZaJ0H_xrVCCQEl7AHrg";

  // This contains the data being sent to Gemini.
  // Based off of the Docs
  const data = {
    contents: [
      {
        "parts": [
          { "text": prompt }
        ]
      }
    ]
  };

  // Convert the object to a JSON string
  const jsonData = JSON.stringify(data);

  // Clarify that you are sending a post request to the URL
  xhttp.open("POST", apiUrl, true);

  // Clarify the request will return in text format.
  xhttp.setRequestHeader("Content-Type", "application/text");

  // Now intiate the send.
  xhttp.send(jsonData);
}

// This basically sends the contents of an email to GeminiAI
function Cmail_sendInformationToAI() {
  // The email contents is contained in the class 'ii gt'
  // it may change...
  if (document.getElementsByClassName("ii gt")[0]) {
    // Get all the text underneath the element.
    let emailText = document.getElementsByClassName("ii gt")[0].innerText;
    // Finally send this information to Gemini, specifing the goal
    // as well as the content
    Cmail_HttpSend("Summarize the contents of the email in a less than half the original email's size in detailed sentences: " + emailText);
  } else {
    // If the element has not been found, you are able to make the loop try again.
    // this usually happens if the page loads late.
    Cmail_lastUrl = "";

    // Invalidate everything...
    Cmail_response = "";
    Cmail_responseValid = false;
  }
}

// This is the main loop
function Cmail_Loop() {
  if(Cmail_responseValid)
  {
    Cmail_sendDataToScripts("CMAIL_READY: " + Cmail_response);
  }else{
    Cmail_sendDataToScripts("CMAIL_NOT_READY");
  }

  // This is the current url path.
  const curUrl = window.location.href;
  // If the current Url is different from the previous then we should continue!
  if (Cmail_lastUrl !== curUrl) {
    // We should make it equal, because we don't want to keep passing the logic
    // gate over and over.
    Cmail_lastUrl = curUrl;

    // Now we make sure that we are at the right page, and that we have an email opened.
    if (curUrl.includes("https://mail.google.com/mail") && curUrl.length > Cmail_magicNumber) {
      

      // Now we can continue with sending the information to Gemini AI.
      Cmail_sendInformationToAI();
    }else{
      // Invalidate everything...
      Cmail_response = "";
      Cmail_responseValid = false;
    }
  }
}

// On window load, this will set up a 'infite' loop running the main loop.
window.addEventListener('load', () => {
  Cmail_interval = setInterval(Cmail_Loop, 100);
});