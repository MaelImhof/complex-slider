/**
 * The class associated to a complex slider container.
 *
 * @type {string}
 */
const COMPLEX_SLIDER_CLASS = "complex-slider";

/**
 * The class associated to a complex slider's text area, where the value
 * of the slider is displayed.
 *
 * @type {string}
 */
const COMPLEX_SLIDER_TEXT_CLASS = "complex-slider-text";

/**
 * The class associated with a complex slider's circle, the element that is
 * the most interesting because it allows the user to interact with the slider.
 * It is also subject to gravity.
 *
 * @type {string}
 */
const COMPLEX_SLIDER_CIRCLE_CLASS = "complex-slider-circle";

/**
 * Initialize this class to display and update every complex slider
 * present on the page.
 */
export default class ComplexSlidersManager {

    /**
     * List of all the existing complex sliders on the page.
     *
     * @type {ComplexSlider[]}
     */
    static #sliders = [];

    /**
     * Indicates whether to keep applying gravity or stop on the next update.
     *
     * @type {boolean}
     */
    static #keepApplyingGravity = true;

    static init() {
        // Retrieve all the sliders in the page
        let sliders = document.getElementsByClassName(COMPLEX_SLIDER_CLASS);

        // Store all the sliders in the array
        for (let i = 0; i < sliders.length; i++) {
            let slider = sliders.item(i);
            let circle = slider.querySelector("."+COMPLEX_SLIDER_CIRCLE_CLASS);
            ComplexSlidersManager.#sliders.push(new ComplexSlider(
                slider,
                slider.querySelector("."+COMPLEX_SLIDER_TEXT_CLASS),
                circle,
                circle.offsetTop,
                0,
                2*circle.offsetTop - circle.offsetHeight,
                0,
                2*circle.offsetLeft,
                56,
                2*circle.offsetLeft - 16
            ));
            circle.addEventListener("pointerdown", ComplexSlidersManager.pointerDown);
        }

        // Start applying gravity to all of the slider circles
        ComplexSlidersManager.applyGravity();
    }

    static applyGravity() {
        ComplexSlidersManager.#sliders.forEach(slider => {
            let circle = slider.circle;
            let top = circle.offsetTop;
            let left = circle.offsetLeft;

            // If the circle is on the bottom of the slider, no gravity
            // If the circle is on the slider's bar, no gravity either
            // If the circle is being dragged by the user, no gravity either
            if (top === slider.maxTop || top === slider.barTop || slider.dragging) {
                ComplexSlidersManager.updateText(slider);
                return;
            }

            // If the circle is very close to the bar, clip it to it
            if (top > slider.barTop - 5 && top < slider.barTop + 5 && left > slider.barMinLeft && left < slider.barMaxLeft) {
                circle.style.top = slider.barTop+"px";
                ComplexSlidersManager.updateText(slider);
                return;
            }

            // Otherwise, apply gravity normally
            let nextTop = top + 5;
            // Avoid going out of the slider
            if (nextTop >= slider.maxTop) {
                nextTop = slider.maxTop;
            }
            circle.style.top = nextTop+"px";
            ComplexSlidersManager.updateText(slider);
        });

        if (ComplexSlidersManager.#keepApplyingGravity) {
            setTimeout(ComplexSlidersManager.applyGravity, 20);
        }
    }

    static updateText(slider) {
        let left = slider.circle.offsetLeft;
        let top = slider.circle.offsetTop;

        let percentageOfBar = (left - slider.barMinLeft) * 100 / (slider.barMaxLeft - slider.barMinLeft);
        let complexPercentage = (top - slider.barTop)*(-1);

        if (complexPercentage === 0) {
            slider.text.innerText = Math.round(percentageOfBar)+"%";
        }
        else {
            slider.text.innerText = Math.round(percentageOfBar) + " + " + Math.round(complexPercentage) + "i %";
        }
    }

    static pointerDown(event) {
        const sliderCircle = event.currentTarget;
        let slider = null;

        // Search the corresponding registered slider
        ComplexSlidersManager.#sliders.forEach(s => {
            if (s.circle === sliderCircle) {
                slider = s;
            }
        });

        // If no registered slider has been found, do nothing
        if (slider === null) {
            return;
        }

        // If a registered slider has been found, initiate the drag on its circle
        ComplexSlidersManager.initiateDrag(slider);
    }

    static initiateDrag(slider) {
        slider.circle.style.touchAction = "none";
        slider.dragging = true;

        const pointerMove = (evt) => {
            // Don't go out of the slider on the left side
            if (slider.circle.offsetLeft <= slider.minLeft && evt.movementX < 0) {
                slider.circle.style.left = slider.minLeft+"px";
                return;
            }
            // Don't go out of the slider on the right side
            if (slider.circle.offsetLeft >= slider.maxLeft && evt.movementX > 0) {
                slider.circle.style.left = slider.maxLeft+"px";
                return;
            }
            // Don't go out of the slider on the top side
            if (slider.circle.offsetTop <= slider.minTop && evt.movementY < 0) {
                slider.circle.style.top = slider.minTop+"px";
                return;
            }
            // Don't go out of the slider on the bottom side
            if (slider.circle.offsetTop >= slider.maxTop && evt.movementY > 0) {
                slider.circle.style.top = slider.maxTop+"px";
                return;
            }

            slider.circle.style.left = `${slider.circle.offsetLeft + evt.movementX}px`;

            // If the circle is on the bar, do not move it vertically
            let left = slider.circle.offsetLeft;
            if (left > slider.barMinLeft && left < slider.barMaxLeft && slider.circle.offsetTop === slider.barTop) {
                return;
            }
            slider.circle.style.top = `${slider.circle.offsetTop + evt.movementY}px`;
        };

        const pointerUp = () => {
            removeEventListener("pointermove", pointerMove);
            removeEventListener("pointerup", pointerUp);
            slider.dragging = false;
        }

        addEventListener("pointermove", pointerMove);
        addEventListener("pointerup", pointerUp)
    }
}

class ComplexSlider {

    /**
     * The element containing the slider. This is the DOM element with class
     * {@link COMPLEX_SLIDER_CLASS}.
     *
     * @type {HTMLDivElement}
     */
    slider;

    /**
     * The element containing the text displayed on top of the slider bar.
     * This is the DOM element with class {@link COMPLEX_SLIDER_TEXT_CLASS}.
     *
     * @type {HTMLDivElement}
     */
    text;

    /**
     * The element representing the circle that is subject to gravity and can
     * be manipulated by the user. This is the DOM element with class
     * {@link COMPLEX_SLIDER_CIRCLE_CLASS}.
     *
     * @type {HTMLDivElement}
     */
    circle;

    /**
     * The value of the attribute offsetTop for the circle corresponding to
     * when it is on the bar exactly.
     *
     * @type {number}
     */
    barTop;

    /**
     * The value of the attribute offsetTop for the circle corresponding to
     * when it is against the ceiling of its parent box (the slider box).
     *
     * @type {number}
     */
    minTop;

    /**
     * The value of the attribute offsetTop for the circle corresponding to
     * when it is on the bottom of the slider and should stop falling.
     *
     * @type {number}
     */
    maxTop;

    /**
     * The value of the attribute offsetLeft for the circle corresponding to
     * when it is on the left limit of the slider and should stop following
     * the cursor.
     *
     * @type {number}
     */
    minLeft;

    /**
     * The value of the attribute offsetLeft for the circle corresponding to
     * when it is on the right limit of the slider and should stop following
     * the cursor;
     *
     * @type {number}
     */
    maxLeft;

    /**
     * The value of the attribute offsetLeft for the circle corresponding to
     * when it is on the left edge of the slider's bar. Starting from this
     * point (included) it will start to fall.
     *
     * @type {number}
     */
    barMinLeft;

    /**
     * The value of the attribute offsetLeft for the circle corresponding to
     * when it is on the right edge of the slider's bar. Starting from this
     * point (included) it will start to fall.
     *
     * @type {number}
     */
    barMaxLeft;

    /**
     * Indicates if the slider's circle is being dragged by the cursor.
     *
     * @type {boolean}
     */
    dragging = false;

    constructor(container, text, circle, barTop, minTop, maxTop, minLeft, maxLeft, barMinLeft, barMaxLeft) {
        this.slider = container;
        this.text = text;
        this.circle = circle;
        this.barTop = barTop;
        this.minTop = minTop;
        this.maxTop = maxTop;
        this.minLeft = minLeft;
        this.maxLeft = maxLeft;
        this.barMinLeft = barMinLeft;
        this.barMaxLeft = barMaxLeft;
    }
}