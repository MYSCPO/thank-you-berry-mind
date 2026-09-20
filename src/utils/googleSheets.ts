import { DiaryEntry } from '../types';

const GAS_URL_STORAGE_KEY = 'thank_you_berry_gas_url';

/**
 * Get the saved Google Apps Script Web App URL from localStorage
 */
export function getGoogleSheetsUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(GAS_URL_STORAGE_KEY) || '';
}

/**
 * Save Google Apps Script Web App URL to localStorage
 */
export function setGoogleSheetsUrl(url: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GAS_URL_STORAGE_KEY, url.trim());
}

/**
 * Send diary entry to Google Apps Script Web App
 * Uses no-cors mode to safely bypass browser CORS restrictions for Google Apps Script
 */
export async function syncDiaryToGoogleSheets(entry: DiaryEntry): Promise<boolean> {
  const gasUrl = getGoogleSheetsUrl();
  if (!gasUrl) {
    // No URL configured, skip silently
    return false;
  }

  try {
    const payload = {
      timestamp: entry.timestamp || new Date().toISOString(),
      dateStr: entry.dateStr,
      grade: entry.grade,
      classroom: entry.classroom,
      number: entry.number,
      studentName: entry.studentName,
      moodType: entry.moodType,
      emotionWord: entry.emotionWord,
      gratitude1: entry.gratitude1 || '',
      gratitude2: entry.gratitude2 || '',
      gratitude3: entry.gratitude3 || '',
      message: entry.message || ''
    };

    // Google Apps Script requires no-cors for client-side direct calls
    await fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return true;
  } catch (err) {
    console.warn('Google Sheets sync notice:', err);
    return false;
  }
}

/**
 * Test ping to Google Apps Script URL
 */
export async function testGoogleSheetsConnection(testUrl: string): Promise<boolean> {
  if (!testUrl || !testUrl.startsWith('https://script.google.com/macros/s/')) {
    return false;
  }

  try {
    const samplePayload = {
      timestamp: new Date().toISOString(),
      dateStr: new Date().toISOString().split('T')[0],
      grade: '1',
      classroom: '1',
      number: '0',
      studentName: '테스트학생',
      moodType: 'A형',
      emotionWord: '감사함',
      gratitude1: '구글 시트 연동 테스트 1',
      gratitude2: '정상 작동 확인 2',
      gratitude3: '땡큐베리마인드 연동 성공 3',
      message: '연동 테스트 데이터입니다.'
    };

    await fetch(testUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(samplePayload)
    });

    return true;
  } catch (err) {
    console.error('Test connection error:', err);
    return false;
  }
}

/**
 * The Google Apps Script template code to provide to the teacher
 */
export const GAS_CODE_TEMPLATE = `/**
 * [땡큐베리마인드] 학생 감사일기 자동 저장 Google Apps Script (Code.gs)
 * 
 * [1분 설치 방법]
 * 1. 구글 드라이브에서 새 '구글 스프레드시트'를 하나 만듭니다.
 * 2. 1행(헤더)에 다음 열 제목들을 적어줍니다:
 *    [A] 기록일시 | [B] 날짜 | [C] 학년 | [D] 반 | [E] 번호 | [F] 이름 | [G] 사분면 | [H] 감정단어 | [I] 감사1(몸) | [J] 감사2(일) | [K] 감사3(칭찬) | [L] 한줄메시지
 * 3. 상단 메뉴 [확장 프로그램] > [Apps Script] 를 클릭합니다.
 * 4. 기존 내용을 모두 지우고 이 코드를 그대로 붙여넣습니다.
 * 5. 우측 상단 파란색 [배포] 버튼 > [새 배포] 클릭
 * 6. 유형 선택(톱니바퀴) > [웹 앱] 선택
 * 7. 다음 설정을 꼭 확인하세요!
 *    - 설명: 땡큐베리마인드 수신용
 *    - 다음 사용자 권한으로 실행: '나(내 계정)'
 *    - 액세스 권한이 있는 사용자: '모든 사용자(Anyone)' (★가장 중요: 학생 로그인을 묻지 않게 함)
 * 8. [배포] 클릭 후 생성된 '웹 앱 URL' (https://script.google.com/macros/s/.../exec)을 복사하여
 *    땡큐베리마인드 웹앱의 [구글 시트 연동] 창에 붙여넣으면 완료!
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // 시트가 완전히 비어있다면 헤더 자동 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "기록일시", "날짜", "학년", "반", "번호", "이름", 
        "사분면", "감정단어", "감사1(몸·건강)", "감사2(작은행복)", "감사3(나의칭찬)", "한줄메시지"
      ]);
      // 헤더 스타일 지정 (배경 연한 초록, 굵게)
      sheet.getRange(1, 1, 1, 12).setBackground("#e6f4ea").setFontWeight("bold");
    }

    // 새로운 행 추가
    sheet.appendRow([
      data.timestamp || new Date(),
      data.dateStr || "",
      data.grade || "",
      data.classroom || "",
      data.number || "",
      data.studentName || "",
      data.moodType || "",
      data.emotionWord || "",
      data.gratitude1 || "",
      data.gratitude2 || "",
      data.gratitude3 || "",
      data.message || ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("땡큐베리마인드 구글 시트 웹앱이 정상 작동 중입니다! :)");
}
`;
