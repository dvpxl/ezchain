var Promise = require('promise');

/**
* JSChain API
* 
* 
* @param obj <Object> (required) — object target for chaining methods
* @param arrayPrototypeNames <Array> (optional) - array list of methods targeted for chaining
* 
* Note: Default behavior chains all prototype methods,
* or you can selectively choose the methods by passing in array of method names.
* Note: If object passed has a callback, this implementation requires that it is 
* located as the first parameter so as to preserve any additional arguments the caller
* has set on the object.
* 
* Note: 
*
* - Enables objects to be chainable to all (or selective) method calls passed in 
* during initialization.
* - When using selective chaining, be sure you are not accidently mixing your chainable
* and non chainable calls.
* - Chainable methods call the subsequent method ONLY AFTER previous
* calls completes.
* - If a callback exists on object's method, it is assumed it is the first parameter.
* 
* Usage / Notes:
* ================
* //your object
* var foo = new Foo();
* //enable the chaining
* JSChain(foo).serial();
* //call by chaining
* foo.callA().callB().callC()
* 
* Assumption: The following 3 lines would be equivalent to the above call
* if A,B,C are all enabled for chaining.  
* 
* foo.callA().B().C()
* //same as below: Might be good to pass into JSChain
* params which would allow caller to set whether such calls are async, or still in serial.
* foo.callA()
* foo.callB()
* foo.callC()
* 
* However a 2nd foo would be asynchrounous to 1st foo object:
* var foo1 = new Foo(); 
* var foo2 = new Foo();
* JSChain(foo2).serial();
* JSChain(foo1).serial();
* foo1.callA().callA().callA()
* foo2.callA().callA().callA()
* 
* 
* For selective chaining pass in array of method names for enabling.
* JSChain(foo, ['method1', 'method2']).serial();
*
* Tests:
* =======
* * Serial completes in order
* * Returns a callback back to original caller
* * Call order preserved when object makes calls in asynchrounous syntax.
* * Object state propogated through chained serial calls.
* * Selectively choose methods for chaining.
* * Different chained instances are asynchrounous 
* 
* 
* TODO Features 
* ===============
* * Return JSChain id to handle cases like aborting, stats, etc.
* * Set MAX_TIMEOUT when any chained method call does not complete by specified time.
* * Params to Continue or Abort if MAX_TIMEOUT already running serial chain.
* * Async - option to simply make prototype methods to be chainable
* * Params options to indicate how to handle async syntax on enabled chained methods: 
* * ie:  
* *      foo.callA(); foo.callA();  // same as foo.callA().callA().
* * option for setting callback location
*
*/

module.exports = EZChain;

var EZChain = (obj, arrayPrototypeNames) => {
	arrayPrototypeNames = arrayPrototypeNames || 'default';
	if(obj === null || obj === undefined) {
		throw Error('Missing parameter when classing jsPrototypeChain');
	}

	if(typeof obj !== 'object') {
		throw Error('Must pass in an object when calling jsPrototypeChain');
	}

	if(arrayPrototypeNames !== 'default' && !(typeof Array.isArray(arrayPrototypeNames))) {
		throw Error('Optional parameter of type: ' + typeof arrayPrototypeNames + ' is not an array');
	}


	var serial = () => __chainMethods(arrayPrototypeNames);
	var prototype = Object.getPrototypeOf(obj);
	var chainStack = [];
	var chainIndex = 0;

	/* 
	* TODO: 
	*/
	function __chainMethods(arrayPrototypeNames) {
		if(arrayPrototypeNames === 'default') {
			Object.keys(prototype).forEach((method, idx) => {
			    console.info("chaining method:", method);
			    __prototypeWrapper(method);
		    
			});

		}
		else {
			arrayPrototypeNames.forEach((method, idx) => {

				__prototypeWrapper(method);

			})
		}
	}

	/*
	* TODO
	*/
	function __prototypeWrapper(name) {

		var method = obj[name];
		obj[name] = function(callback) {
			var that = this;
			var promise = new Promise(function(resolve, reject){
				resolve();
			});

			var callbackWrapper =  function(){

				var callbackContext = callback;
				(callbackContext)? callbackContext.apply(that, arguments): function() {}
				promise.then(__onPromise());
			}

			var invokedMethod = function(){
				method.call(that, callbackWrapper)
			}
			
			var stackObject = {
				'promise': promise, 
				'invokedMethod': invokedMethod
			}

			chainStack.push(stackObject);

			if(chainIndex == 0) {
				chainIndex = 1;
				console.info("index incremented:", chainIndex);
				invokedMethod();

			}

			return this;
		}

	}

	/*
	*
	*/
	function __onPromise() {

		if(chainIndex < chainStack.length) {
			chainStack[chainIndex]['invokedMethod']();
			chainIndex++;
		}
		else {	
			//implicit garbage collect?
			chainIndex = 0;	
			chainStack = null; 
			chainStack = [];
		}

	}

	return {
		serial: serial 
	}
}
