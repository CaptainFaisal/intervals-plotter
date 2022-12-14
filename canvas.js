import config from "./config.json" assert { type: "json" };
const canvas = document.getElementById("canvas");
const canvasContainer = document.getElementsByClassName("canvas-container")[0];
const btnCoordinate = document.getElementById("coordinate");
const btnDownload = document.getElementById("download");
const c = canvas.getContext("2d");
const Canvas = (schedules = 0, maxEnd = 0) => ({
  schedules,
  maxEnd,
  ...config,
  draw() {
    canvas.width =
      2 * this.canvas.offsetX + this.canvas.unitLengthX * this.maxEnd;
    canvas.height =
      2 * this.canvas.offsetY +
      this.canvas.unitLengthY * (this.schedules.length - 1);
    c.fillStyle = this.canvas.backgroundColor;
    c.fillRect(0, 0, canvas.width, canvas.height);
  },
  drawIntervals() {
    this.draw();
    this.schedules.forEach((resource, y) =>
      resource.forEach((task) =>
        Intervals(task.start, task.end, y, this.line.fillColor).draw()
      )
    );
  },
  drawConflicts(task, h) {
    const conflicts = conflictCount(this.schedules, task); //   Structure of conflicts
    conflicts.forEach((resource, y) =>
      resource.forEach((tsk) =>
        Intervals(tsk.start, tsk.end, y, this.conflict.fillColor).draw()
      )
    ); // [[{}, {}, ...], [{}, ...]]
    c.font =
      this.conflict.fontWeight +
      " " +
      this.conflict.fontSize +
      " " +
      this.conflict.fontFace;
    c.fillStyle = this.conflict.fontColor;
    c.textAlign = "center";
    c.fillText(
      String(conflicts.reduce((a, c) => a + c.length, 0) - 1),
      this.canvas.offsetX +
        (this.canvas.unitLengthX * (task.end + task.start)) / 2,
      canvas.height -
        this.canvas.offsetY -
        h * this.canvas.unitLengthY -
        this.conflict.textElevation
    );
  },
  drawCoordinate(task, h) {
    c.font =
      this.coordinate.fontWeight +
      " " +
      this.coordinate.fontSize +
      " " +
      this.coordinate.fontFace;
    c.fillStyle = this.coordinate.fontColor;
    c.textAlign = "center";
    c.fillText(
      `(${task.start}, ${task.end})`,
      this.canvas.offsetX +
        (this.canvas.unitLengthX * (task.end + task.start)) / 2,
      canvas.height -
        this.canvas.offsetY -
        h * this.canvas.unitLengthY -
        this.coordinate.textElevation
    );
  },
  drawAllCoordinates() {
    this.schedules.forEach((res, y) =>
      res.forEach((tsk) => this.drawCoordinate(tsk, y))
    );
  },
});
const Circle = (x, y, radius, color, thickness) => ({
  x,
  y,
  radius,
  color,
  thickness,
  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    c.fillStyle = this.color;
    c.lineWidth = this.thickness;
    c.fill();
    c.stroke();
    c.closePath();
  },
});
const Segment = (point1, point2, color, thickness) => ({
  point1,
  point2,
  color,
  thickness,
  draw() {
    c.beginPath();
    c.moveTo(...point1);
    c.lineTo(...point2);
    c.strokeStyle = this.color;
    c.lineWidth = this.thickness;
    c.stroke();
    c.closePath();
  },
});
const Intervals = (start, end, y, color) => ({
  ...Canvas(),
  ...{
    start,
    end,
    y,
    color,
    draw() {
      const point1 = [
        this.canvas.offsetX + this.canvas.unitLengthX * this.start,
        canvas.height - this.canvas.offsetY - this.canvas.unitLengthY * this.y,
      ];
      const point2 = [
        this.canvas.offsetX + this.canvas.unitLengthX * this.end,
        canvas.height - this.canvas.offsetY - this.canvas.unitLengthY * this.y,
      ];
      Segment(point1, point2, this.color, this.line.thickness).draw();
      Circle(
        ...point1,
        this.circle.radius,
        this.circle.fillColor,
        this.circle.thickness
      ).draw();
      Circle(
        ...point2,
        this.circle.radius,
        this.circle.fillColor,
        this.circle.thickness
      ).draw();
    },
  },
});

const extractIntervals = (inputString) =>
  inputString
    .split("\n")
    .filter((dt, line) => {
      dt = dt.split(" ").map((n) => parseFloat(n));
      if (dt.length == 0) {
        showError("Can't be empty", line);
        return false;
      } else if (dt.length == 1) {
        showError("Ending time is needed", line);
        return false;
      } else if (dt.length > 2) {
        showError("No more than 2 numbers are allowed", line);
        return false;
      } else if (dt[0] >= dt[1]) {
        showError("start time should be smaller than ending time", line);
        return false;
      } else return true;
    })
    .map((row) => {
      row = row.split(" ").map((n) => parseFloat(n));
      return { start: row[0], end: row[1] };
    });
const showError = (msg, line) =>
  editor.getSession().setAnnotations([
    {
      row: line,
      text: msg,
      type: "error",
    },
  ]);
const getCoordinate = (x, y) => [
  x - canvas.offsetLeft + canvasContainer.scrollLeft + window.scrollX,
  y - canvas.offsetTop + canvasContainer.scrollTop + window.scrollY,
];
const getTask = (x, y) =>
  canvObj.schedules.reduce(
    (a, c, yy) => {
      const filtered = c.filter((tsk) => {
        const xi =
          canvObj.canvas.offsetX + tsk.start * canvObj.canvas.unitLengthX;
        const xf =
          canvObj.canvas.offsetX + tsk.end * canvObj.canvas.unitLengthX;
        const ya =
          canvas.height -
          canvObj.canvas.offsetY -
          canvObj.canvas.unitLengthY * yy;
        return x >= xi && x <= xf && y >= ya - 10 && y <= ya + 10;
      });
      return [
        ...a.slice(0, a.length - 1),
        ...filtered,
        filtered.length > 0 ? yy : a[a.length - 1],
      ];
    },
    [-1]
  );

//Driver code

const intervals = extractIntervals(editor.getValue());
const [out, maxEnd] = schedule(intervals);
const canvObj = Canvas(out, maxEnd);
canvObj.drawIntervals();

//Listeners

canvas.addEventListener("click", (evt) => {
  const [x, y] = getCoordinate(evt.clientX, evt.clientY);
  const [task, h] = getTask(x, y);
  canvObj.drawIntervals();
  if (task != -1) canvObj.drawConflicts(task, h);
});
canvas.addEventListener("contextmenu", (evt) => {
  evt.preventDefault();
  const [x, y] = getCoordinate(evt.clientX, evt.clientY);
  const [task, h] = getTask(x, y);
  canvObj.drawIntervals();
  if (task != -1) canvObj.drawCoordinate(task, h);
});
editor.session.on("change", () => {
  const intervals = extractIntervals(editor.getValue());
  const [out, maxEnd] = schedule(intervals);
  canvObj.schedules = out;
  canvObj.maxEnd = maxEnd;
  canvObj.drawIntervals();
});

//btn listeners

btnCoordinate.addEventListener("click", () => {
  canvObj.drawIntervals()
  canvObj.drawAllCoordinates()
});
btnDownload.addEventListener("click", () => {
  let canvasUrl = canvas.toDataURL("image/png", 0.5);
  const createEl = document.createElement("a");
  createEl.href = canvasUrl;
  createEl.download = "intervals";
  createEl.click();
  createEl.remove();
});
