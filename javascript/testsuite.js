/*
All content and code is released into the public domain
http://en.wikipedia.org/wiki/public_domain

Contributors
Glenn Jones - http://glennjones.net/

Takes existing blocks of html with class 'e-x-microformat' 
and creates a viewable version of the code within the page
*/


window.addEventListener('load', function (e) {


    var listItems = document.querySelectorAll('.test-result-list li a');
    var i = listItems.length;
    while (i--) {
        listItems[i].addEventListener('click', function(e){
            e.preventDefault();
            displayTest(e);
        });
        listItems[i].addEventListener('mouseover', function(e){
             e.target.style.textDecoration = 'underline';
        });
        listItems[i].addEventListener('mouseout', function(e){
             e.target.style.textDecoration = 'none';
        });
    }

});


function displayTest(e){
    var label = e.target.innerHTML,
        labelParts = label.split(' - '),
        format = labelParts[0],
        name = labelParts[1];
        
    var testDetailElt = document.querySelector(".test-detail"),
        testStatusElt = document.querySelector("#test-status"),
        testNameElt = document.querySelector("#test-name"),
        testHTMLElt = document.querySelector("#test-html pre code"),
        testJSONElt = document.querySelector("#test-json pre code"),
        testJSONParsedElt = document.querySelector("#test-json-parsed pre code"),
        differencesElt = document.querySelector(".differences"),
        testDiffElt = document.querySelector("#test-diff pre code");
    
        
    if(testData){
        var i = testData.length;
        while (i--) {
            // daul property as key
            if(testData[i].format === format && testData[i].name === name){
                
               testDetailElt.style.display = 'block';
              
               testStatusElt.classList.remove('failed'); 
               if(!testData[i].differences){
                   testStatusElt.innerHTML = parser + '</br>Passed - ' + testData[i].version + '/' +  testData[i].format + '/' + testData[i].name;
               }else{
                   testStatusElt.innerHTML = parser + '</br>Failed -  ' + testData[i].version + '/' +  testData[i].format + '/' + testData[i].name;
                   testStatusElt.classList.add('failed');
               }
                
                //testNameElt.innerHTML = testData[i].version + '/' +  testData[i].format + '/' + testData[i].name + '.html';
                testHTMLElt.innerHTML = encodeHTML(testData[i].html);
                testJSONElt.innerHTML = js_beautify( JSON.stringify( testData[i].json ) );
                testJSONParsedElt.innerHTML = js_beautify( JSON.stringify( testData[i].result ) );
                if(testData[i].differences){
                    testDiffElt.innerHTML = js_beautify( JSON.stringify(testData[i].differences) );
                    testDetailElt.classList.remove('test-passed');
                    testDetailElt.classList.add('test-failed');
                    differencesElt.style.display = 'block';
                }else{
                    testDetailElt.classList.remove('test-passed');
                    testDetailElt.classList.add('test-failed');
                    testDetailElt.classList.add('test-passed');
                    testDetailElt.classList.remove('test-failed');
                    differencesElt.style.display = 'none';
                }
                
           

                
                prettyPrint();
                
              break;
            }
        }
    }   
}   
    // find test based on format and name 
        
   


function encodeHTML(str) {
    return str.toString().replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}


// Does the node have a class
function hasClass(node, className) {
    if (node.className) {
        return node.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
    } else {
        return false;
    }
};
 
 
// Add a class to an node
function addClass(node, className) {
    if (hasClass(node, className)) node.className += " " + className;
};
 
 
// Removes a class from an node
function removeClass(node, className) {
    if (hasClass(node, className)) {
        var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
        node.className = node.className.replace(reg, ' ');
    }
};
 

//create function, it expects 2 values.
function insertAfter(newElement,targetElement) {
    //target is what you want it to go after. Look for this elements parent.
    var parent = targetElement.parentNode;
    
    //if the parents lastchild is the targetElement...
    if(parent.lastchild == targetElement) {
        //add the newElement after the target element.
        parent.appendChild(newElement);
    } else {
        // else the target has siblings, insert the new element between the target and it's next sibling.
        parent.insertBefore(newElement, targetElement.nextSibling);
   }
}