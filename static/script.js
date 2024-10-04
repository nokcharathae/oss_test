let currentAnswerType = '';
let usedQuestions = [];
let allQuestions = [];
let currentQuestion = null;

// 전체 문제 로드
function loadAllQuestions() {
    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            allQuestions = data.questions;
            createQuestionDropdown();
            loadQuestion();
        })
        .catch(error => console.error("Error loading questions:", error));
}

// 문제 ID 드롭다운을 동적으로 생성하는 함수
function createQuestionDropdown() {
    const dropdown = document.getElementById('question-dropdown');
    dropdown.innerHTML = '<option value="">문제를 선택하세요</option>';

    allQuestions.forEach(question => {
        const option = document.createElement('option');
        option.value = question.id;
        option.innerText = `문제 ${question.id}`;
        dropdown.appendChild(option);
    });

    // 드롭다운에서 문제 선택 시 발생하는 이벤트 처리
    dropdown.addEventListener('change', function () {
        if (this.value) {
            loadSpecificQuestion(this.value);
            resetUIForNewQuestion(); // 드롭다운에서 문제를 전환할 때 UI 리셋
        }
    });
}

// 특정 문제 ID를 로드하는 함수
function loadSpecificQuestion(questionId) {
    if (!questionId) return;

    currentQuestion = allQuestions.find(q => q.id === questionId);
    if (currentQuestion) {
        displayQuestion(currentQuestion);
    }
}

// 새로운 문제를 로드하는 함수
function loadQuestion() {
    if (usedQuestions.length === allQuestions.length) {
        document.getElementById("submit-answer").style.display = 'none';
        document.getElementById("restart-quiz").style.display = 'inline-block';
        return;
    }

    let randomQuestion;
    do {
        const randomIndex = Math.floor(Math.random() * allQuestions.length);
        randomQuestion = allQuestions[randomIndex];
    } while (usedQuestions.includes(randomQuestion.id));

    usedQuestions.push(randomQuestion.id);
    loadSpecificQuestion(randomQuestion.id);
    resetUIForNewQuestion(); // UI 리셋
}

// UI를 초기화하는 함수 (중복 제거)
function resetUIForNewQuestion() {
    const submitButton = document.getElementById("submit-answer");
    const nextButton = document.getElementById("next-question");

    submitButton.disabled = false;
    submitButton.style.display = 'inline-block'; // 정답 제출 버튼 표시
    nextButton.style.display = 'none';  // 다음 문제 버튼 숨기기

    document.getElementById("result").innerText = '';
    document.getElementById("correct-answer").innerText = '';
}

// 문제를 화면에 출력하는 함수
function displayQuestion(data) {
    document.querySelector("h1").innerText = `문제 ${data.id}`;

    let questionText = data.question_text;
    if (data.answer_type === 'multiple_choice') {
        questionText += " (중복 선택)";
    }

    document.getElementById("question-text").innerText = questionText;

    // 추가된 정보 (question_info) 처리
    let infoArea = document.getElementById("question-info");
    if (data.question_info && data.question_info.length > 0) {
        infoArea.innerHTML = '';  // 기존 내용을 초기화
        data.question_info.forEach(info => {
            let listItem = document.createElement("li");
            listItem.textContent = info;
            infoArea.appendChild(listItem);
        });
        infoArea.style.display = 'block';  // 정보가 있을 때만 표시
    } else {
        infoArea.style.display = 'none';  // 정보가 없을 때는 숨김
    }

    let answerArea = document.getElementById("answer-area");
    answerArea.innerHTML = '';  // 기존 답변 영역 초기화
    currentAnswerType = data.answer_type;

    // 이미지가 있는 경우 이미지 추가
    if (data.image) {
        let img = document.createElement("img");
        img.src = data.image;  // 이미지 경로 설정
        img.alt = "문제 이미지";
        img.style.maxWidth = "100%";
        img.style.marginBottom = "20px";
        answerArea.appendChild(img);
    }

    // 서술형, 객관식 등의 질문 처리
    if (data.answer_type === 'short' || data.answer_type === 'long') {
        createShortOrLongAnswerField(answerArea);
    } else if (data.answer_type === 'multiple_short') {
        createMultipleShortAnswerFields(answerArea, data.correct_answers.length);
    } else if (data.answer_type === 'multiple_choice') {
        createMultipleChoiceFields(answerArea, data.options);
    } else if (data.answer_type === 'single_choice') {
        createSingleChoiceFields(answerArea, data.options);
    }

    resetUIForNewQuestion(); // 문제 표시 후 UI 리셋
}


// 서술형 또는 긴 답변 필드를 생성하는 함수
function createShortOrLongAnswerField(answerArea) {
    let input = document.createElement("input");
    input.type = "text";
    input.id = "user-answer";
    input.placeholder = "답변을 입력하세요";
    answerArea.appendChild(input);
}

// 여러 개의 짧은 답변 필드를 생성하는 함수
function createMultipleShortAnswerFields(answerArea, count) {
    for (let i = 0; i < count; i++) {
        let input = document.createElement("input");
        input.type = "text";
        input.className = "user-answer";
        input.placeholder = `답변 ${i + 1}을 입력하세요`;
        answerArea.appendChild(input);
        answerArea.appendChild(document.createElement("br"));
    }
}

// 객관식 다중 선택 필드를 생성하는 함수
function createMultipleChoiceFields(answerArea, options) {
    options.forEach((option, index) => {
        let label = document.createElement("label");
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "answer";
        checkbox.value = index;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(option));
        answerArea.appendChild(label);
        answerArea.appendChild(document.createElement("br"));
    });
}

// 객관식 단일 선택 필드를 생성하는 함수
function createSingleChoiceFields(answerArea, options) {
    options.forEach((option, index) => {
        let label = document.createElement("label");
        let radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "answer";
        radio.value = index;
        label.appendChild(radio);
        label.appendChild(document.createTextNode(option));
        answerArea.appendChild(label);
        answerArea.appendChild(document.createElement("br"));
    });
}

// 정답 제출 로직
function submitAnswer() {
    const submitButton = document.getElementById("submit-answer");
    submitButton.disabled = true;

    let userAnswer = getUserAnswer();

    let correct = checkAnswer(userAnswer);
    const resultText = correct ? "정답입니다!" : "틀렸습니다.";
    document.getElementById("result").innerText = resultText;

    if (!correct) {
        displayCorrectAnswer();
    }

    document.getElementById("next-question").style.display = 'inline-block';
}

// 사용자 입력을 가져오는 함수
function getUserAnswer() {
    if (currentAnswerType === 'short' || currentAnswerType === 'long') {
        return document.getElementById("user-answer").value.trim();
    } else if (currentAnswerType === 'multiple_short') {
        let inputs = document.querySelectorAll(".user-answer");
        return Array.from(inputs).map(input => input.value.trim());
    } else if (currentAnswerType === 'multiple_choice') {
        let selected = document.querySelectorAll('input[name="answer"]:checked');
        return Array.from(selected).map(checkbox => parseInt(checkbox.value));
    } else if (currentAnswerType === 'single_choice') {
        let selected = document.querySelector('input[name="answer"]:checked');
        return selected ? parseInt(selected.value) : null;
    }
}

// 정답 체크 로직
function checkAnswer(userAnswer) {
    if (currentAnswerType === 'short' || currentAnswerType === 'long') {
        return currentQuestion.correct_answers.some(answer => answer.trim().toLowerCase() === userAnswer.trim().toLowerCase());
    } else if (currentAnswerType === 'multiple_short') {
        return JSON.stringify(userAnswer) === JSON.stringify(currentQuestion.correct_answers.map(ans => ans.trim().toLowerCase()));
    } else if (currentAnswerType === 'multiple_choice') {
        // multiple_choice의 경우 배열의 순서에 상관없이 비교
        const sortedUserAnswer = userAnswer.sort();  // 사용자 답변을 정렬
        const sortedCorrectAnswer = currentQuestion.correct_answers.sort();  // 정답을 정렬
        return JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer);
    } else if (currentAnswerType === 'single_choice') {
        return userAnswer === currentQuestion.correct_answers[0];  // 단일 선택의 경우 단일 값 비교
    }
}

// 정답을 표시하는 함수
function displayCorrectAnswer() {
    let correctAnswersText;
    if (currentAnswerType === 'multiple_choice' || currentAnswerType === 'single_choice') {
        correctAnswersText = `정답: ${currentQuestion.correct_answers.map(index => currentQuestion.options[index]).join(', ')}`;
    } else {
        correctAnswersText = `정답: ${currentQuestion.correct_answers.join(', ')}`;
    }
    document.getElementById("correct-answer").innerText = correctAnswersText;
}

function loadNextQuestion() {
    loadQuestion();
}

// 퀴즈 리셋 함수
function resetQuiz() {
    usedQuestions = [];
    loadQuestion();
    document.getElementById("completion-message").innerText = '';
    document.getElementById("submit-answer").style.display = 'inline-block';
    document.getElementById("restart-quiz").style.display = 'none';
}

window.addEventListener('DOMContentLoaded', (event) => {
    loadAllQuestions();
});
