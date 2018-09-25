var purchases, categories;

function setup() {
	document.getElementById("categoryButton").addEventListener("click", sendCategory, true);
	document.getElementById("purchaseButton").addEventListener("click", sendPurchase, true);

	// initialize theTable
	poller();
}

/***********************************************************
 * AJAX boilerplate
 ***********************************************************/

function makeRec(method, target, retCode, handlerAction, data) {
	var httpRequest = new XMLHttpRequest();

	if (!httpRequest) {
		alert('Giving up :( Cannot create an XMLHTTP instance');
		return false;
	}

	httpRequest.onreadystatechange = makeHandler(httpRequest, retCode, handlerAction);
	httpRequest.open(method, target);
	
	if (data) {
		httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		httpRequest.send(data);
	}
	else {
		httpRequest.send();
	}	
}


function makeHandler(httpRequest, retCode, action) {
	console.log("making handler!");
	function handler() {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			if (httpRequest.status === retCode) {
				console.log("recieved response text:  " + httpRequest.responseText);
				action(httpRequest.responseText);
			} else {
				alert("There was a problem with the request.  you'll need to refresh the page!");
			}
		}
	}
	return handler;
}

/*******************************************************
 * Actual client-side application logic
 *******************************************************/

function poller() {
	makeRec("GET", "/purchases", 200, repopulatePurchases);
	makeRec("GET", "/categories", 200, repopulateCategories);
}

function sendCategory() {
	var categoryName = document.getElementById("categoryName").value.trim()
	var categoryLimit = document.getElementById("categoryLimit").value.trim()
	if (categoryName.length == 0 || categoryLimit.length == 0)
	{
		alert("You must input values in all category fields.");
		return false;
	}
	if (!isValidCurrency(categoryLimit)) {
		alert("You must enter a valid category limit in the format: #.##");
		return false;
	}
	var data = "categoryName=" + categoryName + "&categoryLimit=" + categoryLimit;
	makeRec("POST", "/categories", 201, poller, data);
	document.getElementById("categoryName").value = "";
	document.getElementById("categoryLimit").value = "";
}

function deleteCategory(categoryID) {
	makeRec("DELETE", "/category/" + categoryID, 204, poller);
}

function sendPurchase() {
	var purchaseAmount = document.getElementById("purchaseAmount").value.trim()
	var purchaseDescription = document.getElementById("purchaseDescription").value.trim()
	var purchaseDate = document.getElementById("purchaseDate").value.trim()
	var purchaseCategory = document.getElementById("purchaseCategory").value.trim()
	if (purchaseAmount.length == 0 || purchaseDescription.length == 0 || purchaseDate.length == 0 || purchaseCategory.length == 0)
	{
		alert("You must input values in all purchase fields.");
		return false;
	}
	if (!isValidDate(purchaseDate)) {
		alert("You must enter a valid purchase date in the format: yyyy-mm-dd");
		return false;
	}
	if (!isValidCurrency(purchaseAmount)) {
		alert("You must enter a valid purchase amount in the format: #.##");
		return false;
	}
	var data = "purchaseAmount=" + purchaseAmount + "&purchaseDescription=" + purchaseDescription + "&purchaseDate=" + purchaseDate + "&purchaseCategory=" + purchaseCategory;
	makeRec("POST", "/purchases", 201, poller, data);
	document.getElementById("purchaseAmount").value = "";
	document.getElementById("purchaseDescription").value = "";
	document.getElementById("purchaseDate").value = "";
	document.getElementById("purchaseCategory").value = "";
}

function deletePurchase(purchaseID) {
	makeRec("DELETE", "/purchases/" + purchaseID, 204, poller);
}

// Helper function for repopulation:
function addCell(row, text) {
	var newCell = row.insertCell();
	var newText = document.createTextNode(text);
	newCell.appendChild(newText);
}

function repopulateCategories(responseText) {
	console.log("repopulating categories!");
	categories = JSON.parse(responseText);
	var tab = document.getElementById("categoriesTable");
	var newRow, newCell, category, attribute, newButton;

	while (tab.rows.length > 0) {
		tab.deleteRow(0);
	}
	
	newRow = tab.insertRow();
	addCell(newRow, 'Name');
	addCell(newRow, 'Limit');
	addCell(newRow, 'Remaining');
	
	for (category in categories) {
		newRow = tab.insertRow();
		//addCell(newRow, category);
		for (attribute in categories[category]) {
			//addCell(newRow, attribute);
			addCell(newRow, categories[category][attribute]);
		}
		
		addCell(newRow, getCategoryStatus(categories[category]["categoryName"], categories[category]["categoryLimit"]));
		newCell = newRow.insertCell();
		newButton = document.createElement("input");
		newButton.type = "button";
		newButton.value = "Delete category";
		// Format different from what was projected in classn
		(function(_category){ newButton.addEventListener("click", function() { deleteCategory(_category); }); })(category);
		newCell.appendChild(newButton);
	}
}

function repopulatePurchases(responseText) {
	console.log("repopulating purchases!");
	purchases = JSON.parse(responseText);
	var tab = document.getElementById("purchasesTable");
	var newRow, purchase, attribute;

	while (tab.rows.length > 0) {
		tab.deleteRow(0);
	}
	
	newRow = tab.insertRow();
	addCell(newRow, 'Amount');
	addCell(newRow, 'Description');
	addCell(newRow, 'Date');
	addCell(newRow, 'Category');
	
	for (purchase in purchases) {
		newRow = tab.insertRow();
		for (attribute in purchases[purchase]) {
			addCell(newRow, purchases[purchase][attribute]);
		}
	}
}

function getCategoryStatus(categoryName, categoryLimit) {
	var total = 0, difference = 0;
	for (purchase in purchases) {
		if (purchases[purchase]["purchaseCategory"] == categoryName) {			
			var oneDay = 24*60*60*1000;
			var firstDate = new Date();
			var secondDate = new Date(purchases[purchase]["purchaseDate"]);
			var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
			if (diffDays <= 30) {
				total += parseFloat(purchases[purchase]["purchaseAmount"]);
			}
		}
	}
	difference = categoryLimit - total;
	return difference.toFixed(2);
}

// Validates that the input string is a valid date formatted as "yyyy-mm-dd"
function isValidDate(dateString)
{
    // First check for the pattern
    if(!/^\d{4}\-\d{2}\-\d{2}$/.test(dateString))
        return false;

    // Parse the date parts to integers
    var parts = dateString.split("-");
    var day = parseInt(parts[2], 10);
    var month = parseInt(parts[1], 10);
    var year = parseInt(parts[0], 10);

    // Check the ranges of month and year
    if(year < 1000 || year > 3000 || month == 0 || month > 12)
        return false;

    var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

    // Adjust for leap years
    if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
        monthLength[1] = 29;

    // Check the range of the day
    return day > 0 && day <= monthLength[month - 1];
};

// Validates that the input string is a valid currency formatted as "#.##"
function isValidCurrency(currencyString)
{
    // Check for the pattern
    if(!/^[0-9]+\.[0-9][0-9]$/.test(currencyString))
        return false;
	
	return true;
};

// Setup load event
window.addEventListener("load", setup, true);
