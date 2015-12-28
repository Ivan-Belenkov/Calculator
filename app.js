/**
 * Created by ibelenkov on 28.12.2015.
 */

"use strict";

class Calculator {
    constructor(container) {
        this._container = container;

        this._container.classList.add("calculator");
        this._container.innerHTML = this._renderSkeleton();
    }

    _renderSkeleton() {
        return `<div class="calculator__display"></div>
                <div class="calculator__buttons clearfix">
                    <div class="calculator__digits"></div>
                    <div class="calculator__functions"></div>
                </div>`;
    }
}

let calculatorId = document.getElementById("calc");

let calculator = new Calculator(calculatorId);