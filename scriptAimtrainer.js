const START = 0, DOMINANT = 1, SWITCH = 2, NONDOMINANT = 3, END = 4;
const experiment = {
  dominantHandTrials: [],
  nonDominantHandTrials: [],
  trialsPerHand: 10,
  state: 0,
  misses: 0,
  state: START,
  targetShownAt: -1,
  current: null,
  previous: null,
  btnDisabled: false,
  pid: crypto.randomUUID(), // unique identifier for participant
};

const btn = document.querySelector(".button-default");
const stimulus = document.querySelector(".circle");
const area = document.querySelector("#stimulus");

const enableButton = function () {
  btn.classList.add("button-enabled");
  btn.classList.remove("button-disabled");
  experiment.btnDisabled = false;
}

const disableButton = function () {
  btn.classList.remove("button-enabled");
  btn.classList.add("button-disabled");
  experiment.btnDisabled = true;
}

const GetTrialsList = function () {
  if (experiment.state == DOMINANT)
    return experiment.dominantHandTrials;
  return experiment.nonDominantHandTrials;
}

const GetIsCurrentlyPlaying = function() {
  return experiment.state == DOMINANT || experiment.state == NONDOMINANT;
}

const advanceTrial = function () {
  //reset stimulus
  updateStimulus("inactive");

  if (GetTrialsList().length < experiment.trialsPerHand) {
    //still need to run more trials
    showStimulus();
  } else {
    if (experiment.state == DOMINANT) {
      // switch hands
      promptSwitchToNonDominant();
    }
    else {
      //experiment ended
      endExperiment();
    }
  }
};

const promptSwitchToNonDominant = function () {
  experiment.state = SWITCH;
  let instructions = document.querySelector("#instructions");
  instructions.innerHTML = "Now please switch to your non dominant hand"
  instructions.style.display = "";
  btn.innerHTML = "Continue"
  experiment.btnDisabled = false;
  enableButton();
}

const endExperiment = function () {
  console.info("INFO: Experiment ended. Await download of results");

  experiment.state = END;

  //Update Button Styling
  experiment.btnDisabled = false;
  btn.classList.toggle("button-enabled");
  btn.classList.toggle("button-disabled");
  btn.textContent = "Download Data";

  document.getElementById("resetButton").style.display = "";
  document.getElementById("text").innerHTML += " - Thank you for playing :-)";
};

const scheduleStimulus = function () {
  experiment.stimulusWait = true;
  const randomDelay = Math.floor(Math.random() * 4 + 2); // 2 - 5s
  experiment.waitHnd = window.setTimeout(showStimulus, randomDelay * 1000); //setTimeout runs in milliseconds
  console.info(
    "INFO: Trial",
    GetTrialsList().length,
    ". Random delay:",
    randomDelay
  );
};

const logReaction = function () {
  const time = performance.now() - experiment.targetShownAt;
  console.info("INFO: User reaction captured.", time);

  const { current, previous } = experiment;
  const distance = previous
    ? Math.hypot(current.x - previous.x, current.y - previous.y)
    : null; // the first target has no previous one

  GetTrialsList().push({ time, x: current.x, y: current.y, distance });
  document.querySelector("#time").textContent = time.toFixed(0) + " ms";
};

const randomLocation = function () {
  const maxX = area.clientWidth - stimulus.offsetWidth;
  const maxY = area.clientHeight - stimulus.offsetHeight;
  return {
    x: Math.random() * maxX,
    y: Math.random() * maxY,
  };
};

const showStimulus = function () {
  const pos = randomLocation();
  stimulus.style.left = pos.x + "px";
  stimulus.style.top = pos.y + "px";

  experiment.previous = experiment.current;
  experiment.current = pos;

  updateStimulus("active");
  experiment.targetShownAt = performance.now();
  console.info(
    "INFO: Trial",
    GetTrialsList().length,
    ". Stimulus shown at",
    Math.round(pos.x),
    Math.round(pos.y)
  );
};

const updateStimulus = function (state) {
  const otherState = state == "active" ? "inactive" : "active";

  stimulus.classList.add(state);
  stimulus.classList.remove(otherState);
};

const userReaction = function (evt) {
  if (!GetIsCurrentlyPlaying())
    return;

  evt.stopPropagation(); // stops this click also counting as a miss on the area
  logReaction();
  advanceTrial();
};

const missReaction = function () {
  if (!GetIsCurrentlyPlaying())
    return;
  experiment.misses++;
};

const startExperiment = function () {
  disableButton();
  console.info("INFO: Experiment Started");
  document.querySelector("#instructions").style.display = "none";
  experiment.state = DOMINANT;
  advanceTrial();
};

const handsSwitched = function () {
  disableButton();
  console.info("INFO: Hands Switched");
  document.querySelector("#instructions").style.display = "none";
  experiment.state = NONDOMINANT;
  advanceTrial();
};

const showStats = function () {
  const stats = computeStatistics(GetTrialsList().map((t) => t.time));
  document.querySelector("#time").textContent = [
    "Count:",
    stats.cnt,
    "Mean:",
    stats.mean.toFixed(2),
    "ms",
    "SD:",
    stats.sd.toFixed(2),
    "ms",
    "Misses:",
    experiment.misses,
  ].join(" ");
}

const btnAction = function () {
  if (experiment.btnDisabled)
    return;

  switch (experiment.state) {
    case START:
      startExperiment();
      break;
    case SWITCH:
      handsSwitched();
      break;
    case END:
      exportExperimentLog();
      showStats();
      break;
  }
};

const computeStatistics = function (timeArr) {
  //to get mean, get sum of all trials and divide by number of trials m = sum(x)/cnt(x)
  const sums = timeArr.reduce((acc, num) => acc + num, 0);
  const meanDeltaTime = sums / timeArr.length;

  //standard deviation is  sqrt(sum(x-mean)^2/cnt(x))
  const squaredDiffs = timeArr.reduce(
    (acc, num) => (num - meanDeltaTime) ** 2 + acc,
    0
  );
  const standardDeviationTime = Math.sqrt(squaredDiffs / timeArr.length);

  return {
    sd: standardDeviationTime,
    mean: meanDeltaTime,
    cnt: timeArr.length,
  };
};

const getTrialText = function(trials, hand) {
  return trials.map((trial, index) => [
    experiment.pid,
    index,
    trial.time.toFixed(1),
    trial.distance === null ? "0" : trial.distance.toFixed(0),
    hand
  ].join(",")).join("\n")
}

const exportExperimentLog = function () {
  let csvHeader = "pid,trial#,time (ms),distance (px),hand\n";
  let csvData = getTrialText(experiment.dominantHandTrials, "dominant") + "\n" + getTrialText(experiment.nonDominantHandTrials, "nondominant");
  
  exportData(csvHeader + csvData, experiment.pid);
};

const exportData = function (csvDataString, exportFileName) {
  // Create a Blob with the CSV data
  const blob = new Blob([csvDataString], { type: "text/csv" });

  // Create a temporary link element
  const a = document.createElement("a");
  a.href = window.URL.createObjectURL(blob);
  a.download = exportFileName;

  // Trigger the download
  document.body.appendChild(a);
  a.style.display = "none";
  a.click();

  // Clean up
  window.URL.revokeObjectURL(a.href);
  document.body.removeChild(a);
};

const reset = function() {
  location.reload();
}

btn.addEventListener("click", btnAction);
stimulus.addEventListener("click", userReaction); // clicking the circle = a hit
area.addEventListener("click", missReaction); // clicking the empty area = a miss
document.getElementById("resetButton").addEventListener("click", reset);