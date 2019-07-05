const dut = require('../build/Release/dut.node');
const {Sim, SimUtils, RisingEdge, FallingEdge, Interfaces} = require('signalflip-js');
const { Clock } = SimUtils;
const {Elastic} = Interfaces;
const _ = require('lodash');
//const chai = require('chai');
//const expect = chai.expect;
const jsc = require('jsverify');
const assert = require('assert');

const model = (din_array) => {
    let dout = [];
    while(din_array.length > 0) {
	dout.push(din_array[0] << 2);
	din_array.shift();
    }
    return dout;
}

let sim;
let target, initiator;

describe('Basic Group', () => {
    beforeEach(() => {
	// set up the environment
	dut.init(); // Init dut
	sim = new Sim(dut, dut.eval);

	/*const init = () => {
	    dut.t0_data(0);
	    dut.t0_valid(0);
	    dut.clk(0);
	    dut.rstf(0);
	};
	init();*/

	function* reset() {
	    dut.rstf(0);
	    for(let i of _.range(5)) {
		yield* RisingEdge(dut.clk);
	    }
	    dut.rstf(1);
	}
	sim.addTask(reset());

	let clk = new Clock(dut.clk, 1);
	sim.addClock(clk);

	target = new Elastic(sim, 0, dut.clk, dut.t0_data, dut.t0_valid, dut.t0_ready, null);
	initiator = new Elastic(sim, 1, dut.clk, dut.i0_data, dut.i0_valid, dut.i0_ready, null);
	//target.print = true;
	let din = _.range(10).map(x => x);
	target.txArray = din.slice();
	sim.addTask(() => {
	    let dout = model(din.slice());
	    //		    assert(_.isEqual(dout, initiator.rxArray));
	    
	    
	    dout.map((x,i) => {
		if(x != initiator.rxArray[i])
		    console.log('x: ', x, ' i: ', i, 'initiator[i]: ', initiator.rxArray[i]);
	    });

	    try{
		assert.deepEqual(dout, initiator.rxArray);
	    } catch(e){
		//console.log(e);
		dut.finish();
		throw(e);
	    }
	},'POST_RUN');
	
    });
    it('Constant valid - Constant ready', () => {
	//this.timeout(6000); // test timeout in milliseconds
	dut.init("top_cc");
	target.randomizeValid = ()=>{ return jsc.random(0,5); };
	initiator.randomizeReady = ()=>{ return jsc.random(0,5); };
	initiator.randomize = 0;
	target.randomize = 0;

	target.init();
	//console.log(target.txArray);
	initiator.init();

	sim.run(100);
    });
    
    it('Randomized valid - Constant Ready', () => {
	//this.timeout(6000); // test timeout in milliseconds
	dut.init("top_rc");
	target.randomizeValid = ()=>{ return jsc.random(0,5); };
	initiator.randomizeReady = ()=>{ return jsc.random(0,5); };
	initiator.randomize = 0;
	target.randomize = 1;
	//initiator.print = true;
	//target.print = true;
	target.init();
	initiator.init();

	sim.run(1000);
    });
    
    it('Constant valid - Randomized ready', () => {
	//this.timeout(6000); // test timeout in milliseconds
	dut.init("top_cr");
	target.randomizeValid = ()=>{ return jsc.random(0,5); };
	initiator.randomizeReady = ()=>{ return jsc.random(0,5); };
	initiator.randomize = 1;
	target.randomize = 0;

	target.init();
	initiator.init();

	sim.run(1000);
    });

    it('Randomized valid - Randomized ready', () => {
	//this.timeout(6000); // test timeout in milliseconds
	dut.init("top_rr");
	target.randomizeValid = ()=>{ return jsc.random(0,5); };
	initiator.randomizeReady = ()=>{ return jsc.random(0,5); };
	initiator.randomize = 1;
	target.randomize = 1;

	target.init();
	initiator.init();

	sim.run(1000);
    });
    
});


