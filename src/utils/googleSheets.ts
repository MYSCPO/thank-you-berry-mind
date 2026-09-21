import { DiaryEntry, Student, MoodType } from '../types';
import { formatShortDate, cleanDigits } from './storage';

const GAS_URL_STORAGE_KEY = 'thank_you_berry_gas_url';

function normalizeMoodType(val: any): MoodType {
  const str = String(val || '').trim();
  if (str.startsWith('A') || str.includes('해') || str.includes('맑음')) return 'A형';
  if (str.startsWith('C') || str.includes('구름') || str.includes('흐림')) return 'C형';
  if (str.startsWith('D') || str.includes('비') || str.includes('빗방울')) return 'D형';
  return 'B형';
}

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
 * Initialize Google Sheets URL from query string (?gas=... or ?sheet=...)
 * This allows teachers to share a unique link with their students so student devices automatically bind to the correct sheet.
 */
export function initGoogleSheetsUrlFromQuery(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const gasParam = params.get('gas') || params.get('sheet');
    if (gasParam && gasParam.startsWith('https://script.google.com/macros/s/')) {
      setGoogleSheetsUrl(gasParam);
      return gasParam;
    }
  } catch (e) {
    // Ignore URL parsing errors
  }
  return null;
}

/**
 * Build shareable link for students with the current GAS URL embedded
 */
export function buildDistributionUrl(gasUrl: string): string {
  if (typeof window === 'undefined' || !gasUrl) return '';
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  return `${baseUrl}?gas=${encodeURIComponent(gasUrl.trim())}`;
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
        .map((s: any) => {
          const rawGrade = String(s.grade || '1').replace(/[^0-9]/g, '') || '1';
          const rawClass = String(s.classroom || '1').replace(/[^0-9]/g, '') || '1';
          const rawNum = String(s.number || '1').replace(/[^0-9]/g, '') || '1';
          return {
            grade: rawGrade,
            classroom: rawClass,
            number: rawNum,
            name: String(s.name || '').trim()
          };
        });

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
      const cleaned: DiaryEntry[] = data.diaries.map((d: any, idx: number) => {
        const cleanDate = formatShortDate(d.dateStr || d.timestamp);
        return {
          id: String(d.id || `sheet-${idx}-${Date.now()}`),
          timestamp: String(d.timestamp || (cleanDate ? `${cleanDate}T00:00:00.000Z` : new Date().toISOString())),
          dateStr: cleanDate,
          grade: cleanDigits(d.grade) || '1',
          classroom: cleanDigits(d.classroom) || '1',
          number: cleanDigits(d.number) || '1',
          studentName: String(d.studentName || '').trim(),
          moodType: normalizeMoodType(d.moodType),
          emotionWord: String(d.emotionWord || '평온한').trim(),
          gratitude1: String(d.gratitude1 || '').trim(),
          gratitude2: String(d.gratitude2 || '').trim(),
          gratitude3: String(d.gratitude3 || '').trim(),
          message: String(d.message || '').trim()
        };
      });

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
 * [땡큐베리마인드] 학생 감사일기 자동 저장 & 학생 명렬표 & 과거 기록(DiaryData) 연동 Google Apps Script (Code.gs)
 * 
 * [스프레드시트 탭(Sheet) 지원 구성]
 * 1. [일기 데이터 탭] : 'DiaryData' 또는 '감사일기_수집' 탭
 *    - 과거에 작성해 둔 감사일기(6월 등)가 들어있는 시트입니다.
 *    - 1행 헤더에 [날짜, 학년, 반, 번호, 이름, 사분면, 감정단어, 감사1, 감사2, 감사3, 메시지] 등의 이름이 포함되어 있으면
 *      열 순서가 달라도 자동으로 감지하여 완벽히 연동됩니다.
 * 2. [학생 명렬표 탭] : '학생명렬표' 또는 '명렬표' (학년 | 반 | 번호 | 이름)
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
    // DiaryData 또는 감사일기_수집 시트에 저장 (학생명렬표 탭은 보존)
    var sheet = ss.getSheetByName("DiaryData") || 
                ss.getSheetByName("diaryData") || 
                ss.getSheetByName("감사일기_수집") || 
                ss.getSheetByName("감사일기") || 
                ss.getSheetByName("일기") || 
                ss.getSheetByName("시트1") || 
                ss.getSheets()[0];

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
    
    // 1. 학생 명렬표 조회 요청
    if (action === "getStudents") {
      var rosterSheet = ss.getSheetByName("학생명렬표") || 
                        ss.getSheetByName("명렬표") || 
                        ss.getSheetByName("Students") || 
                        ss.getSheetByName("students");
      
      // 만약 명렬표 시트가 아직 없다면 템플릿과 함께 자동 생성
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
      if (values.length > 1) {
        var rHeaders = values[0];
        function findRCol(keywords, fallback) {
          for (var c = 0; c < rHeaders.length; c++) {
            var h = String(rHeaders[c] || "").toLowerCase().replace(/[\\s\\-_]/g, "");
            for (var k = 0; k < keywords.length; k++) {
              if (h.indexOf(keywords[k].toLowerCase()) !== -1) return c;
            }
          }
          return fallback;
        }

        var rcGrade = findRCol(["학년", "grade"], 0);
        var rcClass = findRCol(["반", "학급", "class", "classroom"], 1);
        var rcNumber = findRCol(["번호", "number", "num"], 2);
        var rcName = findRCol(["이름", "성명", "name", "학생"], 3);

        for (var i = 1; i < values.length; i++) {
          var row = values[i];
          var grade = String(row[rcGrade] != null ? row[rcGrade] : "").replace(/[^0-9]/g, "");
          var classroom = String(row[rcClass] != null ? row[rcClass] : "").replace(/[^0-9]/g, "");
          var number = String(row[rcNumber] != null ? row[rcNumber] : "").replace(/[^0-9]/g, "");
          var name = String(row[rcName] != null ? row[rcName] : "").trim();
          
          if (name && (grade || classroom)) {
            students.push({
              grade: grade || "1",
              classroom: classroom || "1",
              number: number || "1",
              name: name
            });
          }
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        count: students.length,
        students: students
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. 저장된 전체 감사일기 / 과거 기록(DiaryData) 조회 요청
    if (action === "getDiaries") {
      // DiaryData, diaryData, 감사일기_수집, 감사일기, 일기 등 모든 후보 시트 탐색
      var diarySheet = ss.getSheetByName("DiaryData") || 
                       ss.getSheetByName("diaryData") || 
                       ss.getSheetByName("DIARYDATA") || 
                       ss.getSheetByName("감사일기_수집") || 
                       ss.getSheetByName("감사일기") || 
                       ss.getSheetByName("일기") || 
                       ss.getSheetByName("Diaries");

      // 만약 위 이름이 없다면 명렬표가 아닌 다른 시트 탐색
      if (!diarySheet) {
        var allSheets = ss.getSheets();
        for (var s = 0; s < allSheets.length; s++) {
          var sName = allSheets[s].getName();
          if (sName.indexOf("명렬") === -1 && sName.indexOf("Student") === -1 && allSheets[s].getLastRow() > 1) {
            diarySheet = allSheets[s];
            break;
          }
        }
      }

      if (!diarySheet || diarySheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          count: 0,
          diaries: []
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var dValues = diarySheet.getDataRange().getValues();
      var diaries = [];
      var headers = dValues[0];

      // 유연한 열 인덱스 동적 감지 함수
      function findCol(keywords, fallback) {
        for (var c = 0; c < headers.length; c++) {
          var h = String(headers[c] || "").toLowerCase().replace(/[\\s\\-_]/g, "");
          for (var k = 0; k < keywords.length; k++) {
            if (h.indexOf(keywords[k].toLowerCase()) !== -1) return c;
          }
        }
        return fallback;
      }

      var colTimestamp = findCol(["기록일시", "일시", "timestamp", "시간"], 0);
      var colDate = findCol(["날짜", "date", "일자", "작성일"], 1);
      var colGrade = findCol(["학년", "grade"], 2);
      var colClass = findCol(["반", "학급", "class", "classroom"], 3);
      var colNumber = findCol(["번호", "number", "num"], 4);
      var colName = findCol(["이름", "성명", "name", "studentname", "학생"], 5);
      var colMood = findCol(["사분면", "유형", "mood", "날씨", "마음날씨"], 6);
      var colEmotion = findCol(["감정", "emotion", "감정단어"], 7);
      var colGrat1 = findCol(["감사1", "몸", "건강", "신체", "gratitude1"], 8);
      var colGrat2 = findCol(["감사2", "기쁨", "발견", "작은행복", "gratitude2"], 9);
      var colGrat3 = findCol(["감사3", "칭찬", "성찰", "나의칭찬", "잘한점", "gratitude3"], 10);
      var colMsg = findCol(["메시지", "소감", "한줄", "message"], 11);

      // 날짜 안전 변환 헬퍼 (구글시트 Date 객체 및 6월 등 문자열 완벽 처리)
      function toIsoDate(val) {
        if (!val) return "";
        if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val.getTime())) {
          var y = val.getFullYear();
          var m = ("0" + (val.getMonth() + 1)).slice(-2);
          var d = ("0" + val.getDate()).slice(-2);
          return y + "-" + m + "-" + d;
        }
        var s = String(val).trim();
        var match = s.match(/(\\d{4})[-./](\\d{1,2})[-./](\\d{1,2})/);
        if (match) {
          return match[1] + "-" + ("0" + match[2]).slice(-2) + "-" + ("0" + match[3]).slice(-2);
        }
        return s.slice(0, 10);
      }

      // 사분면 정규화 헬퍼
      function toMoodType(val) {
        var str = String(val || "").trim();
        if (str.indexOf("A") === 0 || str.indexOf("해") !== -1 || str.indexOf("맑음") !== -1) return "A형";
        if (str.indexOf("C") === 0 || str.indexOf("구름") !== -1 || str.indexOf("흐림") !== -1) return "C형";
        if (str.indexOf("D") === 0 || str.indexOf("비") !== -1 || str.indexOf("빗방울") !== -1) return "D형";
        return "B형";
      }

      // 1행 헤더 건너뛰고 2행부터 읽기
      for (var j = 1; j < dValues.length; j++) {
        var dRow = dValues[j];
        var rawTimestamp = dRow[colTimestamp];
        var timestamp = "";
        if (rawTimestamp) {
          if (Object.prototype.toString.call(rawTimestamp) === "[object Date]" && !isNaN(rawTimestamp.getTime())) {
            timestamp = rawTimestamp.toISOString();
          } else {
            timestamp = String(rawTimestamp).trim();
          }
        }

        var dateStr = toIsoDate(dRow[colDate] || rawTimestamp);
        if (!timestamp && dateStr) {
          timestamp = dateStr + "T00:00:00.000Z";
        }

        var dGrade = String(dRow[colGrade] != null ? dRow[colGrade] : "").replace(/[^0-9]/g, "");
        var dClass = String(dRow[colClass] != null ? dRow[colClass] : "").replace(/[^0-9]/g, "");
        var dNumber = String(dRow[colNumber] != null ? dRow[colNumber] : "").replace(/[^0-9]/g, "");
        var dStudentName = String(dRow[colName] != null ? dRow[colName] : "").trim();
        var dMoodType = toMoodType(dRow[colMood]);
        var dEmotionWord = String(dRow[colEmotion] != null ? dRow[colEmotion] : "평온한").trim();
        var dGrat1 = String(dRow[colGrat1] != null ? dRow[colGrat1] : "").trim();
        var dGrat2 = String(dRow[colGrat2] != null ? dRow[colGrat2] : "").trim();
        var dGrat3 = String(dRow[colGrat3] != null ? dRow[colGrat3] : "").trim();
        var dMsg = String(dRow[colMsg] != null ? dRow[colMsg] : "").trim();

        // 날짜 또는 이름/감정단어가 있는 유효 행만 추가
        if (dateStr || dStudentName || dGrat1 || dGrat2 || dGrat3) {
          diaries.push({
            id: "sheet-row-" + j,
            timestamp: timestamp || new Date().toISOString(),
            dateStr: dateStr,
            grade: dGrade || "1",
            classroom: dClass || "1",
            number: dNumber || "1",
            studentName: dStudentName,
            moodType: dMoodType,
            emotionWord: dEmotionWord || "평온한",
            gratitude1: dGrat1,
            gratitude2: dGrat2,
            gratitude3: dGrat3,
            message: dMsg
          });
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        sheetName: diarySheet.getName(),
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
