import React, { useState, useEffect } from 'react';
import { memberAPI, categoryAPI } from './api';
import * as XLSX from 'xlsx';

const SoccerTeamPointsManager = () => {
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // 점수 편집 상태 추가

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 카테고리 데이터 로드
        const categoriesData = await categoryAPI.getAll();
        setCategories(categoriesData);
        
        // 멤버 데이터 로드
        const membersData = await memberAPI.getAll();
        setMembers(membersData);
      } catch (err) {
        console.error('데이터 로드 오류:', err);
        setError('데이터를 불러오는 데 문제가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // 점수 증가 함수
  const increaseScore = async (memberId, category) => {
    try {
      setIsEditing(true); // 편집 모드 활성화
      const cat = categories.find(c => c.key === category);
      const incrementValue = cat ? cat.increment : 1;
      
      const updatedMember = await memberAPI.updateScore(memberId, category, incrementValue);
      
      setMembers(members.map(member => 
        member._id === memberId ? updatedMember : member
      ));
    } catch (err) {
      console.error('점수 증가 오류:', err);
      setError('점수를 업데이트하는 데 문제가 발생했습니다.');
    }
  };

  // 점수 감소 함수
  const decreaseScore = async (memberId, category) => {
    try {
      setIsEditing(true); // 편집 모드 활성화
      const cat = categories.find(c => c.key === category);
      const decrementValue = cat ? -cat.decrement : -1;
      
      const updatedMember = await memberAPI.updateScore(memberId, category, decrementValue);
      
      setMembers(members.map(member => 
        member._id === memberId ? updatedMember : member
      ));
    } catch (err) {
      console.error('점수 감소 오류:', err);
      setError('점수를 업데이트하는 데 문제가 발생했습니다.');
    }
  };

  // 새 멤버 추가
  const addNewMember = async () => {
    if (newMemberName.trim() === '') return;
    
    try {
      const newMember = {
        name: newMemberName,
        attendance: 0,
        gameWin: 0,
        roundWin: 0,
        mom: 0,
        fullAttendance: 0,
        extra: 0,
        late: 0,
        absence: 0
      };
      
      const createdMember = await memberAPI.create(newMember);
      setMembers([...members, createdMember]);
      setNewMemberName('');
      setIsEditing(false); // 편집 모드 비활성화
    } catch (err) {
      console.error('멤버 추가 오류:', err);
      setError('새 멤버를 추가하는 데 문제가 발생했습니다.');
    }
  };

  // 멤버 삭제
  const deleteMember = async (id) => {
    if (window.confirm('정말 이 멤버를 삭제하시겠습니까?')) {
      try {
        await memberAPI.delete(id);
        setMembers(members.filter(member => member._id !== id));
        setSelectedMemberId(null);
        setIsEditing(false); // 편집 모드 비활성화
      } catch (err) {
        console.error('멤버 삭제 오류:', err);
        setError('멤버를 삭제하는 데 문제가 발생했습니다.');
      }
    }
  };

  // 멤버 선택
  const selectMember = (id) => {
    if (id === selectedMemberId) {
      setSelectedMemberId(null);
      setIsEditing(false); // 편집 모드 비활성화
    } else {
      setSelectedMemberId(id);
    }
  };

  // 멤버 이름 수정
  const updateMemberName = async (id, newName) => {
    if (newName.trim() === '') return;
    
    try {
      setIsEditing(true); // 편집 모드 활성화
      const member = members.find(m => m._id === id);
      const updatedMember = await memberAPI.update(id, { ...member, name: newName });
      
      setMembers(members.map(member => 
        member._id === id ? updatedMember : member
      ));
    } catch (err) {
      console.error('멤버 이름 수정 오류:', err);
      setError('멤버 이름을 수정하는 데 문제가 발생했습니다.');
    }
  };

  // 카테고리 업데이트
  const updateCategoryValue = async (categoryId, field, value) => {
    const numberValue = parseInt(value, 10);
    if (isNaN(numberValue) || numberValue <= 0) return;
    
    try {
      const category = categories.find(c => c._id === categoryId);
      const updatedCategory = await categoryAPI.update(categoryId, { 
        ...category, 
        [field]: numberValue 
      });
      
      setCategories(categories.map(category => 
        category._id === categoryId ? updatedCategory : category
      ));
    } catch (err) {
      console.error('카테고리 수정 오류:', err);
      setError('카테고리 설정을 수정하는 데 문제가 발생했습니다.');
    }
  };

  // 엑셀 파일 업로드 및 처리
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // 데이터를 JSON으로 변환
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // 헤더 행 찾기 (참석자 열이 있는 행)
        let headerRowIndex = null;
        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          if (row && row.length > 5 && row[0] === "참석자") {
            headerRowIndex = i;
            break;
          }
        }
        
        if (headerRowIndex === null) {
          setError("헤더 행을 찾을 수 없습니다. '참석자' 열이 있는지 확인하세요.");
          setIsUploading(false);
          return;
        }
        
        // 데이터 행 추출 (헤더 다음 행부터)
        const dataRows = rawData.slice(headerRowIndex + 1).filter(row => row && row.length > 0 && row[0]);
        
        // 멤버 데이터 구조화
        const excelMembers = dataRows.map(row => {
          const member = {
            name: row[0],
            attendance: row[1] || 0,
            gameWin: row[2] || 0,
            roundWin: row[3] || 0,
            mom: row[4] || 0,
            fullAttendance: row[5] || 0,
            extra: row[6] || 0,
            late: Math.abs(row[7] || 0),
            absence: Math.abs(row[8] || 0)
          };
          
          return member;
        });
        
        // 서버에 대량 업로드
        const savedMembers = await memberAPI.bulkImport(excelMembers);
        setMembers(savedMembers);
        setIsEditing(false); // 편집 모드 비활성화
        
        setIsUploading(false);
      };
      
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('파일 업로드 오류:', err);
      setError('엑셀 파일을 처리하는 데 문제가 발생했습니다.');
      setIsUploading(false);
    }
  };

  // 엑셀 파일로 내보내기
  const exportToExcel = () => {
    // 데이터 준비
    const headers = [
      '참석자', '출석(+3)', '경기승리수당 (+3)', '라운드 최종 승리수당(+5)', 
      'MOM(+2)', '만근(+5)', '추가항목', '지각(-3)', '무단결석(-10)', '합계', '순위'
    ];
    
    const data = members.map((member, index) => [
      member.name,
      member.attendance,
      member.gameWin,
      member.roundWin,
      member.mom,
      member.fullAttendance,
      member.extra,
      member.late ? -member.late : 0,
      member.absence ? -member.absence : 0,
      member.total,
      index + 1
    ]);
    
    // 헤더 추가
    data.unshift(headers);
    
    // 워크북 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // 워크시트 추가
    XLSX.utils.book_append_sheet(wb, ws, '팀 포인트');
    
    // 파일 저장
    XLSX.writeFile(wb, '축구팀_포인트_' + new Date().toISOString().slice(0, 10) + '.xlsx');
  };

  // 배경 클릭 처리 (테이블 외부 클릭 시 편집 모드 비활성화)
  const handleBackgroundClick = (e) => {
    // 클릭된 요소가 테이블 외부인지 확인
    const isOutsideTable = !e.target.closest('table');
    if (isOutsideTable) {
      setIsEditing(false);
      setSelectedMemberId(null);
    }
  };

  // 이름으로 필터링된 멤버 목록
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 멤버 정렬 (총점 기준) - 편집 중이거나 선택된 멤버가 있으면 정렬하지 않음
  let sortedMembers;
  if (isEditing || selectedMemberId) {
    sortedMembers = [...filteredMembers];
  } else {
    sortedMembers = [...filteredMembers].sort((a, b) => b.total - a.total);
  }
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">데이터를 불러오는 중...</div>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto bg-gray-50" onClick={handleBackgroundClick}>
      <h1 className="text-2xl font-bold mb-4 text-center">축구팀 포인트 관리 시스템</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">오류: </strong>
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="float-right"
          >
            &times;
          </button>
        </div>
      )}
      
      {/* 상단 컨트롤 */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 검색 */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">이름으로 검색</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름 입력..."
              className="border rounded px-3 py-2"
            />
          </div>
          
          {/* 새 멤버 추가 */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">새 멤버 추가</label>
            <div className="flex">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="이름 입력..."
                className="border rounded-l px-3 py-2 flex-grow"
              />
              <button
                onClick={addNewMember}
                className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
              >
                추가
              </button>
            </div>
          </div>
          
          {/* 데이터 관리 */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">데이터 관리</label>
            <div className="flex space-x-2">
              <div className="relative flex-grow">
                <label className="block w-full bg-green-500 text-white text-center px-4 py-2 rounded cursor-pointer hover:bg-green-600">
                  엑셀 가져오기
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
              <button
                onClick={exportToExcel}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 flex-grow"
              >
                엑셀 내보내기
              </button>
            </div>
          </div>
        </div>
        
        {/* 통계 */}
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <div className="flex justify-between items-center">
            <span className="font-medium">총 멤버 수:</span>
            <span className="font-bold">{members.length}명</span>
          </div>
        </div>
      </div>
      
      {/* 카테고리 설정 */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="text-lg font-medium mb-3">포인트 카테고리 설정</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">카테고리</th>
                <th className="border p-2 text-center">증가값</th>
                <th className="border p-2 text-center">감소값</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category._id} className="border-b">
                  <td className="border p-2">
                    {category.label}
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={category.increment}
                      onChange={(e) => updateCategoryValue(category._id, 'increment', e.target.value)}
                      className="border p-1 w-16 text-center"
                      min="1"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={category.decrement}
                      onChange={(e) => updateCategoryValue(category._id, 'decrement', e.target.value)}
                      className="border p-1 w-16 text-center"
                      min="1"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 멤버 목록 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-3">멤버 포인트 관리</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-center">순위</th>
                <th className="border p-2 text-left">이름</th>
                <th className="border p-2 text-center">출석(+3)</th>
                <th className="border p-2 text-center">경기승리(+3)</th>
                <th className="border p-2 text-center">라운드승리(+5)</th>
                <th className="border p-2 text-center">MOM(+2)</th>
                <th className="border p-2 text-center">만근(+5)</th>
                <th className="border p-2 text-center">추가항목</th>
                <th className="border p-2 text-center">지각(-3)</th>
                <th className="border p-2 text-center">무단결석(-10)</th>
                <th className="border p-2 text-center">합계</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((member, index) => {
                const isSelected = member._id === selectedMemberId;
                
                return (
                  <tr 
                    key={member._id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isSelected ? 'bg-blue-50' : ''}`}
                    onClick={() => selectMember(member._id)}
                  >
                    <td className="border p-2 text-center">{index + 1}</td>
                    <td className="border p-2">
                      {isSelected ? (
                        <div className="flex">
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => updateMemberName(member._id, e.target.value)}
                            className="border p-1 flex-grow"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMember(member._id);
                            }}
                            className="ml-2 bg-red-500 text-white px-2 rounded hover:bg-red-600"
                          >
                            삭제
                          </button>
                        </div>
                      ) : (
                        member.name
                      )}
                    </td>
                    
                    {/* 출석 */}
                    <td className="border p-1">
                      <div className="flex flex-col items-center">
                        <div className="mb-1">{member.attendance || 0}</div>
                        {isSelected && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                decreaseScore(member._id, 'attendance');
                              }}
                              className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                              -
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                increaseScore(member._id, 'attendance');
                              }}
                              className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* 경기승리수당 */}
                    <td className="border p-1">
                      <div className="flex flex-col items-center">
                        <div className="mb-1">{member.gameWin || 0}</div>
                        {isSelected && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                decreaseScore(member._id, 'gameWin');
                              }}
                              className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                              -
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                increaseScore(member._id, 'gameWin');
                              }}
                              className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* 라운드 최종 승리수당 */}
                    <td className="border p-1">
                      <div className="flex flex-col items-center">
                        <div className="mb-1">{member.roundWin || 0}</div>
                        {isSelected && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                decreaseScore(member._id, 'roundWin');
                              }}
                              className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                              -
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                increaseScore(member._id, 'roundWin');
                              }}
                              className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* MOM */}
                    <td className="border p-1">
                      <div className="flex flex-col items-center">
                        <div className="mb-1">{member.mom || 0}</div>
                        {isSelected && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                decreaseScore(member._id, 'mom');
                              }}
                              className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                              -
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                increaseScore(member._id, 'mom');
                              }}
                              className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* 만근 */}
                    <td className="border p-1">
                      <div className="flex flex-col items-center">
                        <div className="mb-1">{member.fullAttendance || 0}</div>
                        {isSelected && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                decreaseScore(member._id, 'fullAttendance');
                              }}
                              className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                              -
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                increaseScore(member._id, 'fullAttendance');
                              }}
                              className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* 추가항목 */}
                    <td className="border p-1">
                      <div className="flex flex-col items-center">
                        <div className="mb-1">{member.extra || 0}</div>
                        {isSelected && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                decreaseScore(member._id, 'extra');
                              }}
                              className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                              -
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                increaseScore(member._id, 'extra');
                              }}
                              className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* 지각 */}
                    <td className="border p-1">
                      <div className="flex flex-col items-center">
                        <div className="mb-1">{member.late || 0}</div>
                        {isSelected && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                decreaseScore(member._id, 'late');
                              }}
                              className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                              -
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                increaseScore(member._id, 'late');
                              }}
                              className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* 무단결석 */}
                    <td className="border p-1">
                      <div className="flex flex-col items-center">
                        <div className="mb-1">{member.absence || 0}</div>
                        {isSelected && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                decreaseScore(member._id, 'absence');
                              }}
                              className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                              -
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                increaseScore(member._id, 'absence');
                              }}
                              className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* 합계 */}
                    <td className="border p-2 text-center font-bold">
                      {member.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold mb-2">사용 방법:</h3>
        <ol className="list-decimal pl-6 space-y-1 text-sm">
          <li>멤버를 클릭하면 해당 멤버의 점수 관리 옵션(+/- 버튼)이 표시됩니다.</li>
          <li>포인트 카테고리 설정에서 각 항목별 증가/감소 값을 조정할 수 있습니다.</li>
          <li>새 멤버 추가 기능으로 팀원을 추가할 수 있습니다.</li>
          <li>이름 검색으로 특정 멤버를 빠르게 찾을 수 있습니다.</li>
          <li>멤버를 선택한 상태에서 이름을 수정하거나 삭제할 수 있습니다.</li>
          <li>엑셀 파일로 데이터를 가져오거나 내보낼 수 있습니다.</li>
          <li>모든 데이터는 서버에 자동 저장되므로 페이지를 닫아도 유지됩니다.</li>
        </ol>
      </div>
    </div>
  );
};

export default SoccerTeamPointsManager;
