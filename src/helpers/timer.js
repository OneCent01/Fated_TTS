const initSelfCorrectingTimerState = (interval, options={}) => ({
  expected: Date.now() + interval,
  ticks: 0,
  timeout: null,
  isRunning: false,
  ...options,
});

export const selfCorrectingTimer = (options) => {
  const {onUpdate, interval=1000} = options;

  let timerState = initSelfCorrectingTimerState(interval);
  const step = () => {
    var drift = Date.now() - timerState.expected;
    timerState.ticks++;
    
    if(typeof onUpdate === 'function') {
      onUpdate(timerState.ticks);
    }

    timerState.expected += interval;
    const timeoutMs = Math.max(0, interval - drift);
    timerState.timeout = setTimeout(step, timeoutMs); // take into account drift
  }

  return {
    pause: () => {
      if(!timerState.isRunning || !timerState.timeout) {
        return;
      }
      clearTimeout(timerState.timeout);
      timerState.timeout = null;
      timerState.isRunning = false;
    },
    resume: () => {
      if(timerState.isRunning) {
        return;
      }
      timerState.timeout = setTimeout(step, interval);
      timerState.isRunning = true;
    },
    start: () => {
      if(timerState.isRunning) {
        return;
      }
      timerState = initSelfCorrectingTimerState(interval, {
        timeout: setTimeout(step, interval),
        isRunning: true,
      });
    }
  }
};

export const runTimer = (sessionData, options={}) => {
	const {seconds=5, onComplete, canvas} = options;

	const timer = selfCorrectingTimer({
		onUpdate: ticks => {
			timerState.ticks++;
			timerState.progress = timerState.ticks / timerState.totalTicks;
			if(ticks % 100 === 0 && timerState.remaining) {
				timerState.remaining--;
			}
		},
		interval: 10,
	});

	const timerState = {
		gameTicks: 0,
		ticks: 0,
		totalTicks: seconds * 100,
		progress: 0,
		remaining: seconds,
		pause: ()=>{},
		isPaused: false,
		isDone: false,
		onComplete: onComplete || (()=>{}),
		canvas,
		context: canvas?.getContext('2d'),
		...timer,
	}

	timer.start();

	window.requestAnimationFrame(() => drawLoop(sessionData, timerState))

	const pauseTimer = () => {
		if(timerState.isPaused) {
			return;
		}
		timer.pause();
		timer.isPaused = true;
	}

	return {
		pause: pauseTimer,
		resume: () => {
			if(!timerState.isPaused) {
				return;
			}
			timer.resume();
			timer.isPaused = false;
		},
		end: () => {
			pauseTimer();
			timerState.isDone = true;
		},
	};
};

const drawLoop = (sessionData, timerState) => {
	timerState.gameTicks++;
	const {
		context, 
		canvas, 
		progress, 
		gameTicks, 
		ticks, 
		totalTicks, 
		remaining,
		onComplete,
		pause,
	} = timerState;
	context.clearRect(0, 0, canvas.width, canvas.height);
	const lineWidth = 6;
	context.lineWidth = lineWidth;
	const fontSize = 42;
	context.font = `bold ${fontSize}px Karla`;

	const r = 220 * Math.min(progress * 2, 1);
	const g = 220 * (1 - Math.max((progress - 0.5) * 2, 0));
	const color = `rgb(${r},${g},30)`;
	context.strokeStyle = color;

	context.beginPath();
	context.fillStyle = 'lightgrey';

	const {width, height} = canvas;
	const xCenter = width / 2;
	const yCenter = height / 2;
	const radius = (Math.min(width, height) / 2) - lineWidth;
	const yText = yCenter + fontSize / 4;
	const xText = yCenter - fontSize / 4;

	context.arc(xCenter, yCenter, radius, 0, Math.PI * 2);
	context.fill();

	if(ticks >= totalTicks) {
		pause();
		timerState.isPaused = true;
		timerState.isDone = true;
		onComplete();

		context.fillStyle = color;
		context.beginPath();
		context.arc(xCenter, yCenter, radius, 0, 2 * Math.PI);
		context.stroke();
		if((gameTicks % 100) <= 60) {
			context.fillText(remaining, xText, yText);
		}
	} else {
		const start = -Math.PI / 2;
		const range = 2 * Math.PI;
		const end = start + range;
		const currentStart = start + (range * progress);
		context.fillStyle = 'darkgrey';

		context.moveTo(xCenter, yCenter);
		context.beginPath();
		context.lineTo(xCenter, lineWidth);

		context.arc(xCenter, yCenter, radius, start, (progress * Math.PI * 2) + start, true);

		context.lineTo(xCenter, yCenter);
		context.closePath()
		context.fill();

		context.fillStyle = color;

		context.beginPath();
		context.arc(xCenter, yCenter, radius, currentStart, end);
		context.stroke();

		context.fillText(remaining, xText - ((`${remaining}`.length-1) * 10), yText);
	}

	if(!timerState.isDone) {
		window.requestAnimationFrame(() => drawLoop(sessionData, timerState))
	}
};
