import { DiaryEntry, Student } from '../types';

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
 * Uses no-cors mode to safely bypass browser CORS restrictions for Google Apps Script POST
 */
export async function syncDiaryToGoogleSheets(entry: DiaryEntry): Promise<boolean> {
  const gasUrl = getGoogleSheetsUrl();
  if (!gasUrl) {
    // No URL configured, skip silently
    return false;
  }

  try {
    const payload = {
      action: 'saveDiary',
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
 * Fetch registered student roster directly from the Google Spreadsheet
 */
export async function fetchStudentsFromGoogleSheets(url?: string): Promise<{
  success: boolean;
  students?: Student[];
  error?: string;
}> {
  const gasUrl = (url || getGoogleSheetsUrl()).trim();
  if (!gasUrl) {
    return { success: false, error: '구글 시트 연동 URL이 설정되지 않았습니다.' };
  }

  try {
    const queryUrl = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}action=getStudents&_t=${Date.now()}`;
    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data && data.status === 'success' && Array.isArray(data.students)) {
      // Normalize students data
      const cleaned: Student[] = data.students
        .filter((s: any) => s && s.name)
        .map((s: any) => ({
          grade: String(s.grade || '1').trim(),
          classroom: String(s.classroom || '1').trim(),
          number: String(s.number || '1').trim(),
          name: String(s.name || '').trim()
        }));

      return { success: true, students: cleaned };
    } else {
      return { success: false, error: data.message || '명렬표 데이터를 파싱할 수 없습니다.' };
    }
  } catch (err: any) {
    console.error('Fetch students error:', err);
    return {
      success: false,
      error: '구글 시트에서 명렬표를 불러오지 못했습니다. 아래 안내에 따라 Apps Script 코드를 최신으로 배포했는지 확인해 주세요.'
    };
  }
}

/**
 * Fetch historical diary entries directly from the Google Spreadsheet (감사일기_수집 탭)
 */
export async function fetchDiariesFromGoogleSheets(url?: string): Promise<{
  success: boolean;
  diaries?: DiaryEntry[];
  error?: string;
}> {
  const gasUrl = (url || getGoogleSheetsUrl()).trim();
  if (!gasUrl) {
    return { success: false, error: '구글 시트 연동 URL이 설정되지 않았습니다.' };
  }

  try {
    const queryUrl = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}action=getDiaries&_t=${Date.now()}`;
    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data && data.status === 'success' && Array.isArray(data.diaries)) {
      const cleaned: DiaryEntry[] = data.diaries.map((d: any, idx: number) => ({
        id: String(d.id || `sheet-${idx}-${Date.now()}`),
        timestamp: String(d.timestamp || new Date().toISOString()),
        dateStr: String(d.dateStr || '').slice(0, 10),
        grade: String(d.grade || '1').trim(),
        classroom: String(d.classroom || '1').trim(),
        number: String(d.number || '1').trim(),
        studentName: String(d.studentName || '').trim(),
        moodType: (d.moodType || 'B형') as any,
        emotionWord: String(d.emotionWord || '평온한').trim(),
        gratitude1: String(d.gratitude1 || '').trim(),
        gratitude2: String(d.gratitude2 || '').trim(),
        gratitude3: String(d.gratitude3 || '').trim(),
        message: String(d.message || '').trim()
      }));

      return { success: true, diaries: cleaned };
    } else {
      return { success: false, error: data.message || '일기 데이터를 파싱할 수 없습니다.' };
    }
  } catch (err: any) {
    console.warn('Fetch diaries notice:', err);
    return {
      success: false,
      error: '구글 시트에서 과거 기록을 불러오지 못했습니다.'
    };
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
      action: 'saveDiary',
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
 * [땡큐베리마인드] 학생 감사일기 자동 저장 & 학생 명렬표 연동 Google Apps Script (Code.gs)
 * 
 * [스프레드시트 탭(Sheet) 구성 안내]
 * 1. [탭 1] 감사일기_수집 : 학생들의 감사일기가 제출되면 실시간으로 1행씩 기록되는 시트
 * 2. [탭 2] 학생명렬표     : 선생님께서 학생 명단을 적어두는 시트 (하단 '+' 버튼으로 추가!)
 *    - 1행 (헤더) : 학년 | 반 | 번호 | 이름
 *    - 2행부터    : 1   | 1  | 1   | 강민우
 *                   1   | 1  | 2   | 김서연
 *                   2   | 3  | 7   | 김하은  (나이스 명렬표 복사-붙여넣기 가능!)
 * 
 * [설치 및 배포 방법]
 * 1. 스프레드시트 상단 메뉴 [확장 프로그램] > [Apps Script] 클릭
 * 2. 기존 코드를 모두 지우고 이 코드를 그대로 붙여넣습니다.
 * 3. 우측 상단 파란색 [배포] > [새 배포] (또는 [배포 관리]에서 수정 > 새 버전)
 * 4. 유형: [웹 앱] 선택
 * 5. 설정:
 *    - 다음 사용자 권한으로 실행: '나(내 계정)'
 *    - 액세스 권한이 있는 사용자: '모든 사용자(Anyone)' (★필수: 학생/앱 접근 허용)
 * 6. 생성된 '웹 앱 URL' (https://script.google.com/macros/s/.../exec)을 복사하여 연동창에 저장!
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    // 감사일기는 반드시 '감사일기_수집' 탭에 기록 (학생명렬표 탭을 덮어쓰지 않음)
    var sheet = ss.getSheetByName("감사일기_수집") || ss.getSheetByName("시트1") || ss.getSheets()[0];
    var data = JSON.parse(e.postData.contents);
    
    // 시트가 완전히 비어있다면 헤더 자동 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "기록일시", "날짜", "학년", "반", "번호", "이름", 
        "사분면", "감정단어", "감사1(몸·건강)", "감사2(작은행복)", "감사3(나의칭찬)", "한줄메시지"
      ]);
      sheet.getRange(1, 1, 1, 12).setBackground("#e6f4ea").setFontWeight("bold");
    }

    // 새로운 감사일기 행 추가
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
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (e && e.parameter && e.parameter.action) || "";
    
    // 학생 명렬표 조회 요청
    if (action === "getStudents") {
      var rosterSheet = ss.getSheetByName("학생명렬표") || ss.getSheetByName("명렬표") || ss.getSheetByName("Students");
      
      // 만약 명렬표 시트가 아직 없다면 템플릿과 함께 자동 생성해 드립니다!
      if (!rosterSheet) {
        rosterSheet = ss.insertSheet("학생명렬표");
        rosterSheet.appendRow(["학년", "반", "번호", "이름"]);
        rosterSheet.getRange(1, 1, 1, 4).setBackground("#e8f0fe").setFontWeight("bold");
        rosterSheet.appendRow(["1", "1", "1", "강민우"]);
        rosterSheet.appendRow(["1", "1", "2", "김서연"]);
        rosterSheet.appendRow(["2", "3", "7", "김하은"]);
      }
      
      var values = rosterSheet.getDataRange().getValues();
      var students = [];
      // 1행은 제목이므로 2행부터 데이터를 읽어옵니다
      for (var i = 1; i < values.length; i++) {
        var row = values[i];
        var grade = String(row[0] != null ? row[0] : "").trim();
        var classroom = String(row[1] != null ? row[1] : "").trim();
        var number = String(row[2] != null ? row[2] : "").trim();
        var name = String(row[3] != null ? row[3] : "").trim();
        
        if (name && grade) {
          students.push({
            grade: grade,
            classroom: classroom,
            number: number,
            name: name
          });
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        count: students.length,
        students: students
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 저장된 전체 감사일기 데이터 조회 요청 (교사 대시보드 및 통계 연동)
    if (action === "getDiaries") {
      var diarySheet = ss.getSheetByName("감사일기_수집") || ss.getSheetByName("시트1") || ss.getSheets()[0];
      if (!diarySheet || diarySheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          count: 0,
          diaries: []
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var dValues = diarySheet.getDataRange().getValues();
      var diaries = [];
      // 1행 헤더 건너뛰고 2행부터 읽기
      for (var j = 1; j < dValues.length; j++) {
        var dRow = dValues[j];
        var timestamp = dRow[0] ? new Date(dRow[0]).toISOString() : "";
        var dateStr = String(dRow[1] != null ? dRow[1] : "").trim();
        if (!dateStr && timestamp) {
          dateStr = timestamp.slice(0, 10);
        }
        var dGrade = String(dRow[2] != null ? dRow[2] : "").trim();
        var dClass = String(dRow[3] != null ? dRow[3] : "").trim();
        var dNumber = String(dRow[4] != null ? dRow[4] : "").trim();
        var dStudentName = String(dRow[5] != null ? dRow[5] : "").trim();
        var dMoodType = String(dRow[6] != null ? dRow[6] : "B형").trim();
        var dEmotionWord = String(dRow[7] != null ? dRow[7] : "").trim();
        var dGrat1 = String(dRow[8] != null ? dRow[8] : "").trim();
        var dGrat2 = String(dRow[9] != null ? dRow[9] : "").trim();
        var dGrat3 = String(dRow[10] != null ? dRow[10] : "").trim();
        var dMsg = String(dRow[11] != null ? dRow[11] : "").trim();

        if (dStudentName || dEmotionWord) {
          diaries.push({
            id: "sheet-row-" + j,
            timestamp: timestamp,
            dateStr: dateStr,
            grade: dGrade,
            classroom: dClass,
            number: dNumber,
            studentName: dStudentName,
            moodType: dMoodType,
            emotionWord: dEmotionWord,
            gratitude1: dGrat1,
            gratitude2: dGrat2,
            gratitude3: dGrat3,
            message: dMsg
          });
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        count: diaries.length,
        diaries: diaries
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 기본 ping 테스트 응답
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "땡큐베리마인드 구글 시트 웹앱이 정상 작동 중입니다! :)"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
