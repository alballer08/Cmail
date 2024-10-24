// This globally holds the response from Gemini
let summairzedResponse = "";

// This globally holds the current AI response
let Cmail_response = "";

// This globally holds whether the response is valid
let Cmail_responseValid = false;

let Cmail_pop3List = "";

let Cmail_bulkLoadingInterval = null;

// global login info
let myEmail = "jadynsgamesofficial@gmail.com";
let myPassword = "xwzubxjpasgoaqob";

if (document.getElementById("bulk"))
    document.getElementById("bulk").addEventListener("click", Cmail_bulkSummary);

// This listens for messages from other tabs...
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const DATA = request.Cmail_message;
    // Make sure these messages are coming from the tab
    if (DATA && sender.origin === "https://mail.google.com") {
        // Respond...
        sendResponse({ response: "Message received" });

        // Update the button
        if (DATA.includes("CMAIL_READY")) {
            if (document.getElementById("summarize")){
                document.getElementById("summarize").disabled=false;
                document.getElementById("summarize").innerText = "Summarize";
            }

            // Basically I could not set the listener, because the page kept loading too fast
            // so this is going to be here...
            if (document.getElementById("summarize"))
                document.getElementById("summarize").addEventListener("click", SummarizeEmail);
        }
        else if (DATA == "CMAIL_NOT_READY") {
            /* YOU GUYS SHOULD MAKE THIS BETTER */
            if (document.getElementById("summarize")){
                document.getElementById("summarize").disabled=true;
                document.getElementById("summarize").innerText = "Nothing To Summarize";
            }
        }

        // If a the AI response is included we are good to go.
        if (DATA.includes("CMAIL_READY: ")) {

            // Substring it out...
            summairzedResponse = DATA.substring(DATA.indexOf(": ") + 2);
        }
    }
});

function SummarizeEmail() {
    // Basically just replace it...
    const element = document.getElementById("summarize");
    /* YOU GUYS SHOULD MAKE THIS BETTER */
    document.getElementById("p-summary").innerText = summairzedResponse;
    // Remove the element from the DOM
    element.remove();
}



// This is a basic function to send a prompt to the GeminiAI, using your API key.
function Cmail_HttpSend(prompt) {
    console.log('hi');
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
      
      document.getElementById("p-summary").innerText = Cmail_response;
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

function Cmail_renderLoading(){
  let bulkLoading = document.getElementById('loadingIcon');
  if(Cmail_pop3List !== ""){
    clearInterval(Cmail_bulkLoadingInterval);
    Cmail_bulkLoadingInterval = null;
    bulkLoading.style.display="none";
    return;
  }

  bulkLoading.style.display="block";
}

// summarize the last x emails sent to our account
function Cmail_bulkSummary() {
  Cmail_bulkLoadingInterval = setInterval(Cmail_renderLoading, 50);

  x = document.getElementById("mySlider").getAttribute("value");
  // This creates a new Object
  var xhttp = new XMLHttpRequest();

  // Basically on every 'update' from the request this will be called.
  xhttp.onreadystatechange = () => {
    // Basically returned on success
    if (xhttp.readyState === XMLHttpRequest.DONE && xhttp.status === 200) {
      // Turn text to json
      const data = xhttp.responseText;
      
      Cmail_pop3List = data;
      console.log(data)
      
      Cmail_HttpSend("Condense these emails into a few notes about the most important topics. Combine similar emails when needed. " + data);
    }
  };

  var pop3Url = "https://jadynsgames.com/cmail?email="+myEmail+"&password="+myPassword+"&count="+x;

  // Clarify that you are sending a get request to the URL
  xhttp.open("GET", pop3Url, true);

  // Clarify the request will return in text format.
  xhttp.setRequestHeader("Content-Type", "application/text");

  // Now intiate the send.
  xhttp.send();
}