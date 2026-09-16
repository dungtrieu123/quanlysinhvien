package com.example.quanlysinhvien.service;

import java.util.List;
import java.util.UUID;


import org.springframework.stereotype.Service;


import com.example.quanlysinhvien.entity.Student;
import com.example.quanlysinhvien.repository.StudentRepository;


@Service
public class StudentService {


    private final StudentRepository studentRepository;


    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }


    public List<Student> getAll() {
        return studentRepository.findAll();
    }


    public List<Student> search(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return studentRepository.findAll();
        }
        String value = keyword.trim();
        return studentRepository.findByStudentCodeContainingIgnoreCaseOrFullNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContainingIgnoreCase(
                value, value, value, value);
    }


    public Student getById(UUID id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên với id: " + id));
    }


    public Student save(Student student) {
        return studentRepository.save(student);
    }


    public void delete(UUID id) {
        studentRepository.deleteById(id);
    }
}

