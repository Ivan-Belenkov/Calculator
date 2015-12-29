/**
 * Created by ibelenkov on 28.12.2015.
 */

"use strict";
const MAX_VALUE = 16;

const STATE_INIT = 1;
const STATE_INT = 2;
const STATE_FLOAT = 3;
const STATE_RESOLVED = 4;

const STEP_FIRST_OPERAND = 1;
const STEP_FUNCTION = 2;

const OP_CLEAR = 1;
const OP_EQ = 2;
const OP_ADD = 3;
const OP_SUB = 4;
const OP_MUL = 5;
const OP_DIV = 6;
const OP_POW = 7;
const OP_BACK = 14;

class CalculatorButton {
    constructor(parent, text, value, operationCode, type) {
        this._button = document.createElement("button");
        this._button.className = "calculator__button";
        this._button.innerHTML = text;

        this._button.realValue = value;

        this._button.operation = operationCode;

        this._button.buttonType = type;

        parent.appendChild(this._button);
    }
}

class Calculator {
    constructor(container) {
        this._container = container;

        this._methods = {
            "C": {
                type: "meta",
                operation: OP_CLEAR
            },
            "\u2190": {
                type: "meta",
                operation: OP_BACK
            },
            "+": {
                type: "function",
                operation: OP_ADD
            },
            "\u2212": {
                type: "function",
                operation: OP_SUB
            },
            "\u00D7": {
                type: "function",
                operation: OP_MUL
            },
            "\u00F7": {
                type: "function",
                operation: OP_DIV
            },
            "x<sup>y</sup>": {
                type: "function",
                operation: OP_POW
            },
            "=": {
                type: "meta",
                operation: OP_EQ
            }
        }

        this._currentState = STATE_INIT;
        this._currentStep = null;
        this._currentLength = 0;
        this._templateValue = null;
        this._firstOperand = null;
        this._secondOperand = null;

        this._currentOperation = null;

        this._container.classList.add("calculator");

        this._renderSkeleton();

        this._renderDigits();
        this._renderFunctions();

        this._container.addEventListener("click", this._onClickHandler.bind(this));

        this._setText("0");
    }

    /*
     * render block
     */
    _renderSkeleton() {
        this._container.innerHTML = `
            <div class="calculator__display">
                <div class="calculator__operation"></div>
                <div class="calculator__val"></div>
            </div>
            <div class="calculator__panel clearfix">
                <div class="calculator__digits clearfix"></div>
                <div class="calculator__functions clearfix"></div>
            </div>
        `;
    }

    _renderDigits() {
        let digits = this._container.querySelector(".calculator__digits");

        for (let i = 1; i < 10; i++) {
            new CalculatorButton(digits, i, i, null, "digit");
        }
        new CalculatorButton(digits, '0', 0, null, "digit");
        digits.lastElementChild.classList.add("calculator__button_zero");
        new CalculatorButton(digits, ',', '.', null, "decimalSeparator");
    }

    _renderFunctions() {
        let functions = this._container.querySelector(".calculator__functions"),
            collection = this._methods;

        for (let key in collection) {
            new CalculatorButton(functions, key, null, collection[key].operation, collection[key].type);
        }
    }

    /*
     * display helpers
     */
    _setText(str) {
        this._container.querySelector(".calculator__val").innerHTML = str;
    }

    _setOperationText(str) {
        this._container.querySelector(".calculator__operation").innerHTML = str;
    }

    /*
     * helpers
     */
    _clear() {
        this._firstOperand = null;
        this._secondOperand = null;
        this._templateValue = null;
        this._currentLength = 0;
        this._currentState = STATE_INIT;

        this._setText("0");

        return;
    }

    _fix() {
        if (this._currentState === STATE_RESOLVED || this._currentState === STATE_INIT || this._currentLength === 1) {
            this._clear();
            return;
        }

        if (this._templateValue.slice(-1) === ".") {
            this._templateValue = this._templateValue.slice(0, -1);
            this._currentState = STATE_INT;
        } else {
            this._templateValue = this._templateValue.slice(0, -1);
            this._currentLength--;
        }

        this._setText(this._templateValue);

        return;
    }

    _eq() {
        switch (this._currentStep) {
            case null:
                break;
            case STEP_FIRST_OPERAND:
                let first = this._firstOperand,
                    second = this._secondOperand === null ? this._firstOperand : this._secondOperand ,
                    result = this._exeq(first, second);

                this._secondOperand = this._firstOperand;
                this._firstOperand = result;

                this._setText(result);
        }
    }

    _exeq(a, b) {
        switch (this._currentOperation) {
            case OP_ADD:
                return a + b;
                break;
            case OP_SUB:
                return a - b;
                break;
            case OP_MUL:
                return a * b;
                break;
            case OP_DIV:
                return a / b;
                break;
            case OP_POW:
                return Math.pow(a, b);
                break;
            default:
                return;
        }
    }

    /*
     * event handlers
     */
    _onClickHandler(e) {
        switch (e.target.buttonType) {
            case "digit":
                this._digitHandler(e.target);
                break;
            case "decimalSeparator":
                this._decimalSepHandler(e.target);
                break;
            case "meta":
                this._metaHandler(e.target);
                break;
            case "function":
                this._operationHandler(e.target);
                break;
            default:
                return false;
        }
    }

    _digitHandler(el) {
        if (this._currentLength === MAX_VALUE) {
            return false
        }

        if (this._currentState === STATE_INIT && el.realValue === 0) {
            return false;
        }

        if (this._currentState === STATE_RESOLVED && el.realValue === 0) {
            this._clear();

            return;
        }

        if (this._currentState === STATE_INIT && el.realValue !== 0) {
            this._templateValue = el.realValue;
            this._currentLength = 1;
            this._currentState = STATE_INT;

            this._setText(this._templateValue);

            return;
        }

        if (this._currentState === STATE_RESOLVED && el.realValue !== 0) {
            this._clear();

            this._templateValue = el.realValue;
            this._currentLength = 1;
            this._currentState = STATE_INT;

            this._setText(this._templateValue);

            return;
        }

        if (this._currentState !== STATE_INIT && this._currentState !== STATE_RESOLVED) {
            this._templateValue += "" + el.realValue;
            this._currentLength++;

            this._setText(this._templateValue);
        }
    }

    _decimalSepHandler(el) {
        if (this._currentState === STATE_FLOAT) return false;

        if (this._currentState === STATE_INIT || this._currentState === STATE_RESOLVED) {
            this._templateValue = "0."
            this._currentLength = 1;
            this._currentState = STATE_FLOAT;

            this._setText(this._templateValue);

            return;
        }

        if (this._currentState === STATE_INT) {
            this._templateValue += "."
            this._currentState = STATE_FLOAT;

            this._setText(this._templateValue);

            return;
        }
    }

    _metaHandler(el) {
        switch (el.operation) {
            case OP_CLEAR:
                this._clear();
                break;
            case OP_BACK:
                this._fix();
                break;
            case OP_EQ:
        }
    }

    _operationHandler(el) {
        if (this._currentStep === null) {
            this._currentOperation = el.operation;
            this._currentStep = STEP_FIRST_OPERAND;
            this._firstOperand = parseFloat(this._templateValue);

            let string = el.operation === OP_POW ? `${this._firstOperand} ^` : `${this._firstOperand} ${el.innerHTML}`;

            this._setOperationText(string);
        }
    }
}

let calculatorId = document.getElementById("calc");

let calculator = new Calculator(calculatorId);