let currentAnswerType = '';
let usedQuestions = [];
let allQuestions = [];
let currentQuestion = null;

// 전체 문제 로드
function loadAllQuestions() {
    fetch('questions.json')  // Flask 백엔드 대신 로컬 JSON 파일을 로드
        .then(response => response.json())
        .then(data => {
            allQuestions = data.questions;
            createQuestionDropdown();  // 문제 선택 드롭다운 생성
            loadQuestion();  // 첫 번째 문제 로드
        })
        .catch(error => console.error("Error loading questions:", error));
}

// 문제 ID 드롭다운을 동적으로 생성하는 함수
function createQuestionDropdown() {
    const dropdown = document.getElementById('question-dropdown');
    dropdown.innerHTML = '<option value="">문제를 선택하세요</option>';  // 기존 옵션 초기화

    allQuestions.forEach(question => {
        const option = document.createElement('option');
        option.value = question.id;
        option.innerText = `문제 ${question.id}`;
        dropdown.appendChild(option);
    });
}

// 특정 문제 ID를 로드하는 함수
function loadSpecificQuestion(questionId) {
    if (!questionId) return;  // 선택된 문제가 없으면 종료

    currentQuestion = allQuestions.find(q => q.id === questionId);
    if (currentQuestion) {
        displayQuestion(currentQuestion);
    }
}

// 문제를 로드하면서 중복되지 않도록 설정
function loadQuestion() {
    if (usedQuestions.length === allQuestions.length) {
        // 모든 문제를 다 풀었을 때의 처리
        document.getElementById("submit-answer").style.display = 'none';
        document.getElementById("restart-quiz").style.display = 'inline-block';
        return;
    }

    let randomIndex = Math.floor(Math.random() * allQuestions.length);
    let randomQuestion = allQuestions[randomIndex];

    while (usedQuestions.includes(randomQuestion.id)) {
        randomIndex = Math.floor(Math.random() * allQuestions.length);
        randomQuestion = allQuestions[randomIndex];
    }

    usedQuestions.push(randomQuestion.id);

    loadSpecificQuestion(randomQuestion.id);

    // 다음 문제가 로드되었으므로 정답 제출 버튼을 다시 표시
    document.getElementById("submit-answer").style.display = 'inline-block';
    document.getElementById("next-question").style.display = 'none';  // 다음 문제 버튼 숨기기
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
        let input = document.createElement("input");
        input.type = "text";
        input.id = "user-answer";
        input.placeholder = "답변을 입력하세요";
        answerArea.appendChild(input);
    } else if (data.answer_type === 'multiple_short') {
        data.correct_answers.forEach((_, index) => {
            let input = document.createElement("input");
            input.type = "text";
            input.className = "user-answer";
            input.placeholder = `답변 ${index + 1}을 입력하세요`;
            answerArea.appendChild(input);
            answerArea.appendChild(document.createElement("br"));
        });
    } else if (data.answer_type === 'multiple_choice') {
        data.options.forEach((option, index) => {
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
    } else if (data.answer_type === 'single_choice') {
        data.options.forEach((option, index) => {
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

    document.getElementById("result").innerText = '';  // 결과 초기화
    document.getElementById("correct-answer").innerText = '';  // 정답 초기화

    // '다음 문제' 버튼 숨기기 (초기 상태)
    const nextButton = document.getElementById("next-question");
    nextButton.style.display = 'none';
}

function submitAnswer() {
    const submitButton = document.getElementById("submit-answer");
    submitButton.style.display = 'none';  // 정답 제출 후 숨기기

    let userAnswer;

    // 답변 유형에 따라 사용자 답변을 수집
    if (currentAnswerType === 'short' || currentAnswerType === 'long') {
        userAnswer = document.getElementById("user-answer").value.trim();
    } else if (currentAnswerType === 'multiple_short') {
        let inputs = document.querySelectorAll(".user-answer");
        userAnswer = Array.from(inputs).map(input => input.value.trim());
    } else if (currentAnswerType === 'multiple_choice') {
        let selected = document.querySelectorAll('input[name="answer"]:checked');
        userAnswer = Array.from(selected).map(checkbox => parseInt(checkbox.value));
    } else if (currentAnswerType === 'single_choice') {
        let selected = document.querySelector('input[name="answer"]:checked');
        userAnswer = selected ? parseInt(selected.value) : null;
    }

    // 정답 체크 로직 추가
    let correct = false;
    if (currentAnswerType === 'short' || currentAnswerType === 'long') {
        correct = currentQuestion.correct_answers.some(answer => answer.trim().toLowerCase() === userAnswer.trim().toLowerCase());
    } else if (currentAnswerType === 'multiple_short') {
        correct = JSON.stringify(userAnswer) === JSON.stringify(currentQuestion.correct_answers.map(ans => ans.trim().toLowerCase()));
    } else if (currentAnswerType === 'multiple_choice' || currentAnswerType === 'single_choice') {
        correct = JSON.stringify(userAnswer.sort()) === JSON.stringify(currentQuestion.correct_answers.sort());
    }

    const resultText = correct ? "정답입니다!" : "틀렸습니다.";
    document.getElementById("result").innerText = resultText;

    // 틀린 경우 correct_answers의 인덱스를 기반으로 options 값 출력
    if (!correct && (currentAnswerType === 'multiple_choice' || currentAnswerType === 'single_choice')) {
        // correct_answers는 인덱스 값을 저장하고 있으므로 그 인덱스를 사용해 options에서 정답 텍스트 가져오기
        const correctAnswersText = `정답: ${currentQuestion.correct_answers.map(index => currentQuestion.options[index]).join(', ')}`;
        document.getElementById("correct-answer").innerText = correctAnswersText;
    }


    // '다음 문제' 버튼 표시
    const nextButton = document.getElementById("next-question");
    nextButton.style.display = 'inline-block';  // 다음 문제 버튼 표시
}

function loadNextQuestion() {
    loadQuestion();  // 새로운 문제를 로드
    const submitButton = document.getElementById("submit-answer");
    submitButton.style.display = 'inline-block';  // 정답 제출 버튼 다시 보이기
    const nextButton = document.getElementById("next-question");
    nextButton.style.display = 'none';  // 다음 문제 버튼 숨기기
    document.getElementById("result").innerText = '';  // 결과 초기화
    document.getElementById("correct-answer").innerText = '';  // 정답 초기화
}



// Reset quiz to start from the first question
function resetQuiz() {
    usedQuestions = [];  // Clear used questions
    loadQuestion();  // Start with the first question again
    document.getElementById("completion-message").innerText = '';  // Clear the completion message
    document.getElementById("submit-answer").style.display = 'inline-block';  // Show the submit button for the first question
    document.getElementById("restart-quiz").style.display = 'none';  // Hide the restart button initially
}

window.addEventListener('DOMContentLoaded', (event) => {
    loadAllQuestions();
});
