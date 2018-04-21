
let fracMap = {};

/**
* Helper function to aproximate floats as fractions
*/
export function toFrac(x:number) {
  //We use caching to prevent having to recompute the same fraction multiple times
  if(fracMap.hasOwnProperty(x)) {
    return fracMap[x];
  }


  if(Math.abs(x) <= 0.000001) {
    return "0";
  }

  //Based on http://stackoverflow.com/questions/5968636/converting-a-float-into-a-string-fraction-representation
  if(Math.abs(x-1)<=0.000001) {
  	return "1";
  }

  //Compute the order of magnitude of the number ~ This will be the limit of big the denominator can get
  const absLog	= Math.abs(Math.log10(x))+1;
  const precFac = 1000;//Math.min(Math.pow(10, Math.ceil(absLog)),1000);

  //We don't compute the fraction for really small values for performance reasons (also the denominators get to big)
  if(precFac >= 10000) {
    return "0";
  }


  let out = "";

	if (x < 0) {
		out+='-';
		x = -x;
  }


  let l = Math.floor(x);
  if (l != 0) {
    out+=l;
    x-=l;
  }
  let error = Math.abs(x);
  let bestDenominator = 1;

  //Iterate through all denominators and keep the one with the smallest error
  for(let i=2; i<=precFac ;i++) {
    let error2 = Math.abs(x - (Math.round(x * i) / i));
  	if (error2 < error) {
  		error = error2;
  		bestDenominator = i;
  	}
  }

  if (bestDenominator > 1) {
    out+=" "+ Math.round(x * bestDenominator)+"/"+bestDenominator;
  }
  if(out.length == 0){
    out = "0";
  }

  //Test to check if we got (-) x/x as our aproximation.
  let oSplit = out.slice().replace("-","").split("/");

  if(oSplit.length==2 && ( (+oSplit[0]) == (+oSplit[1]))) {
    if(out.startsWith("-")) {
      return "-1";
    }
		return "1";
	}
  out = out.trim();
  fracMap[x] = out;
  return out;
}
