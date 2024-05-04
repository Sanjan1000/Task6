// draw_channel.js
import consumer from "channels/consumer";

consumer.subscriptions.create("DrawChannel", {
  connected() {
    // Initialize the canvas listeners when connected
    this.listenToCanvas();
    this.listenToClearCanvas(); // Add the listener for clearing the canvas
  },

  listenToCanvas() {
    this.canvas = document.getElementById("canvas");
    this.context = this.canvas.getContext("2d");
    this.remoteContext = this.canvas.getContext("2d");

    this.canvas.addEventListener("mousedown", this.startDrawing.bind(this));
    this.canvas.addEventListener("mouseup", this.stopDrawing.bind(this));
    this.canvas.addEventListener("mousemove", this.draw.bind(this));
  },

  listenToClearCanvas() {
    const clearButton = document.getElementById("clear-canvas");
    if (clearButton) {
      clearButton.addEventListener("click", () => {
        this.clearCanvas(); // Clear both local and remote contexts
        this.perform("clear", {}); // Broadcast clear command to all clients
      });
    }
  },

  clearCanvas() {
    // Clear the entire canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.remoteContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },

  startDrawing(event) {
    this.isDrawing = true;
    this.lastX = event.offsetX;
    this.lastY = event.offsetY;
    this.lastSent = Date.now();

    this.perform("draw", {
      x: event.offsetX,
      y: event.offsetY,
      state: "start",
    });
  },

  stopDrawing(event) {
    this.isDrawing = false;
    this.lastX = event.offsetX;
    this.lastY = event.offsetX;
    this.lastSent = Date.now();

    this.perform("draw", {
      x: event.offsetX,
      y: event.offsetY,
      state: "stop",
    });
  },

  draw(event) {
    if (!this.isDrawing) return;

    // Send coordinates every 10ms
    if (Date.now() - this.lastSent > 10) {
      this.perform("draw", {
        x: event.offsetX,
        y: event.offsetY,
        state: "drawing",
      });
      this.lastSent = Date.now();
    }
    this.drawData(event.offsetX, event.offsetY);
  },

  drawData(x, y) {
    this.context.lineJoin = "round";
    this.context.lineCap = "round";

    // Start drawing
    this.context.beginPath();
    this.context.moveTo(this.lastX, this.lastY);
    this.context.lineTo(x, y);
    this.context.stroke();
    this.lastX = x;
    this.lastY = y;
  },

  drawRemoteData(x, y) {
    this.remoteContext.lineJoin = "round";
    this.remoteContext.lineCap = "round";
    this.remoteContext.beginPath();
    this.remoteContext.moveTo(this.remoteLastX, this.remoteLastY);
    this.remoteContext.lineTo(x, y);
    this.remoteContext.stroke();
    this.remoteLastX = x;
    this.remoteLastY = y;
  },

  disconnected() {
    // Handle disconnection
  },

  received(data) {
    // Handle incoming data
    if (data.state === "start") {
      this.remoteLastX = data.x;
      this.remoteLastY = data.y;
      return;
    }

    if (data.state === "stop") {
      this.remoteLastX = data.x;
      this.remoteLastY = data.y;
      return;
    }

    if (data.action === "clear") {
      this.clearCanvas();
      return;
    }

    this.drawRemoteData(data.x, data.y);
  }
});
