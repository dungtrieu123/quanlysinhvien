package com.example.quanlysinhvien.controller;

import java.util.List;
import java.util.UUID;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


import com.example.quanlysinhvien.entity.Student;
import com.example.quanlysinhvien.service.StudentService;


@RestController
@RequestMapping("/api/students")
public class StudentController {


    @Autowired
    private StudentService studentService;


    @GetMapping
    public List<Student> listStudents(
            @RequestParam(required = false) String keyword) {


        return studentService.search(keyword);
    }


    @GetMapping("/{id}")
    public Student getStudent(@PathVariable UUID id) {


        return studentService.getById(id);
    }


    @PostMapping
    public Student createStudent(@RequestBody Student student) {


        return studentService.save(student);
    }


    @PutMapping("/{id}")
    public Student updateStudent(
            @PathVariable UUID id,
            @RequestBody Student student) {


        student.setId(id);


        return studentService.save(student);
    }


    @DeleteMapping("/{id}")
    public void deleteStudent(@PathVariable UUID id) {


        studentService.delete(id);
    }
}
